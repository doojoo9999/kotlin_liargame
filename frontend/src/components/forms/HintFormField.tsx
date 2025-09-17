import * as React from 'react';
import {FormField} from './FormField';

export interface HintFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  bannedWords: string[];
  placeholder?: string;
  timeRemaining: number;
  autoFocus?: boolean;
}

export const HintFormField: React.FC<HintFormFieldProps> = ({
  value,
  onChange,
  maxLength,
  bannedWords,
  placeholder = '힌트 입력',
  timeRemaining,
  autoFocus
}) => {
  const [error, setError] = React.useState<string | undefined>();

  const validate = React.useCallback((val: string) => {
    if (val.length === 0) return '필수 입력';
    if (val.length > maxLength) return `최대 ${maxLength}자`;
    const bad = bannedWords.find((word) =>
      val.toLowerCase().includes(word.toLowerCase())
    );
    if (bad) return '부적절한 단어';
    return undefined;
  }, [maxLength, bannedWords]);

  React.useEffect(() => {
    setError(validate(value));
  }, [validate, value]);

  return (
    <FormField
      name="hint"
      label="힌트"
      error={error}
      helperText={`남은시간 ${timeRemaining}s`}
    >
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="w-full rounded border px-3 py-2 text-sm"
      />
    </FormField>
  );
};
void HintFormField;
