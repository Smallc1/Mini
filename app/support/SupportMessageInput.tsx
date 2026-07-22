"use client";

import type { KeyboardEvent, TextareaHTMLAttributes } from "react";

type SupportMessageInputProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function SupportMessageInput(props: SupportMessageInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    props.onKeyDown?.(event);

    if (
      event.defaultPrevented ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return <textarea {...props} onKeyDown={handleKeyDown} />;
}
