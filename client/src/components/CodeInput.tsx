import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export default function CodeInput({ length = 6, onComplete, disabled = false }: CodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    if (val && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    const code = newValues.join('');
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length > 0) {
      const newValues = Array(length).fill('');
      pasted.split('').forEach((char, i) => {
        newValues[i] = char;
      });
      setValues(newValues);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputs.current[nextIndex]?.focus();
      if (pasted.length === length) {
        onComplete(pasted);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {values.map((val, index) => (
        <input
          key={index}
          ref={(el) => { inputs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: '44px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            outline: 'none',
            fontFamily: 'monospace',
          }}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
