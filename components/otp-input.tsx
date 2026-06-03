"use client";

import {
  useCallback,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const OTP_LENGTH = 4;

const otpBoxClass =
  "h-14 w-14 rounded-xl border-2 border-brand-700/70 bg-brand-50/80 text-center text-2xl font-semibold tabular-nums text-primary outline-none transition duration-200 focus:border-brand-600 focus:bg-brand-50 focus:ring-[3px] focus:ring-brand-600/15 dark:border-brand-500/70 dark:bg-brand-950/40 dark:focus:border-brand-500 dark:focus:ring-brand-500/20";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

export function OtpInput({
  value,
  onChange,
  disabled = false,
  id = "reset-otp",
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  const focusIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  }, []);

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join("").replace(/\D/g, "").slice(0, OTP_LENGTH));
    },
    [onChange]
  );

  function handleChange(index: number, nextChar: string) {
    const digit = nextChar.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateValue(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    onChange(pasted);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  return (
    <div
      className="flex justify-center gap-3 sm:gap-4"
      role="group"
      aria-labelledby={`${id}-label`}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={otpBoxClass}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}

export { OTP_LENGTH };
