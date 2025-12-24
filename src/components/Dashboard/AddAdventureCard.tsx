
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Wand2 } from 'lucide-react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Calendar } from '../ui/Calendar';

interface AddAdventureCardProps {
  onStartPlanning: (date: Date) => void;
}

const AddAdventureCard: React.FC<AddAdventureCardProps> = ({ onStartPlanning }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleStartClick = () => {
    if (date) {
      onStartPlanning(date);
    }
  };

  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">開啟一段新旅程</h3>
        </div>
        <Card className="p-5 flex flex-col items-center justify-center gap-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Wand2 size={32} className="text-stone-500" />
            </div>
            <div className='text-center'>
                <p className="font-bold text-stone-800">新增冒險旅程</p>
                <p className="text-xs text-stone-500 font-bold">選擇一個日期，讓我們開始規劃！</p>
            </div>

            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>選擇日期</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>

            <Button className="w-full" onClick={handleStartClick}>
                <Wand2 className="mr-2 h-4 w-4" />
                開始規劃
            </Button>
        </Card>
    </div>
  );
};

export default AddAdventureCard;
