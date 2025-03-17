'use client';
import React, { HTMLAttributes, useState } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Button } from './button';
import Icons from './icons';

interface Props extends HTMLAttributes<HTMLInputElement> {
  name?: string;
  readOnly?: boolean;
  asVisible?: boolean;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
}

const PasswordInput = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      className,
      name,
      readOnly,
      asVisible,
      required,
      minLength,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div
        data-state={isVisible ? 'shown' : 'hidden'}
        className='relative flex w-full items-center justify-center'
      >
        <Input
          type={isVisible || asVisible ? 'text' : 'password'}
          ref={ref}
          readOnly={readOnly}
          disabled={disabled}
          minLength={minLength ?? 8}
          className={cn(className, 'w-full pr-16')}
          name={name}
          placeholder='Password'
          required={required}
          {...props}
        />
        <Button
          type='button'
          variant={'ghost'}
          onClick={() => setIsVisible((oldVal) => !oldVal)}
          className='absolute right-0 border-none bg-transparent ring-0 hover:bg-transparent focus-visible:border-none focus-visible:ring-0'
        >
          {isVisible || asVisible ? <Icons.visible /> : <Icons.hidden />}
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
