'use client';

import React from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';

const LanguagePicker = () => {
  const [ droppingDown, setDroppingDown ] = React.useState(false);
  return (
    <Select onOpenChange={open => setDroppingDown(open)} defaultValue="es">
      <SelectTrigger className={`${droppingDown ? 'dropping-down' : ''} w-max`}>
        <div className="flex flex-row items-center justify-between gap-x-2">
          <FontAwesomeIcon className='text-foreground' icon={faLanguage} />
          <div className="hidden lg:flex">
            <SelectValue placeholder="Select a fruit" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="es">Español</SelectItem>
          {false && <SelectItem value="en">English</SelectItem>}
          {false && <SelectItem value="ja">日本語</SelectItem>}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default LanguagePicker