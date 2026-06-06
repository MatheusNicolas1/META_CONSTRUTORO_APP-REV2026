import { useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export const SUCCESS_FEEDBACK_EVENT = "meta-construtor:success-feedback";

export type SuccessFeedbackTarget =
  | string
  | HTMLElement
  | MouseEvent
  | ReactMouseEvent
  | {
      message?: string;
      element?: HTMLElement | null;
      x?: number;
      y?: number;
    }
  | undefined;

export interface SuccessFeedbackPayload {
  id: number;
  message?: string;
  x?: number;
  y?: number;
}

const isHTMLElement = (value: unknown): value is HTMLElement =>
  typeof HTMLElement !== "undefined" && value instanceof HTMLElement;

const isMouseEvent = (value: unknown): value is MouseEvent =>
  typeof MouseEvent !== "undefined" && value instanceof MouseEvent;

const isReactMouseEvent = (value: unknown): value is ReactMouseEvent =>
  Boolean(value && typeof value === "object" && "nativeEvent" in value);

const isFeedbackOptions = (
  value: unknown
): value is { message?: string; element?: HTMLElement | null; x?: number; y?: number } =>
  Boolean(value && typeof value === "object");

const getElementCenter = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const resolvePayload = (target?: SuccessFeedbackTarget): SuccessFeedbackPayload => {
  const base = {
    id: Date.now() + Math.random(),
  };

  if (!target) return base;

  if (typeof target === "string") {
    return { ...base, message: target };
  }

  if (isHTMLElement(target)) {
    return { ...base, ...getElementCenter(target) };
  }

  if (isMouseEvent(target)) {
    return {
      ...base,
      x: target.clientX,
      y: target.clientY,
    };
  }

  if (isReactMouseEvent(target) && isMouseEvent(target.nativeEvent)) {
    return {
      ...base,
      x: target.nativeEvent.clientX,
      y: target.nativeEvent.clientY,
    };
  }

  if (!isFeedbackOptions(target)) return base;

  if (target.element) {
    return {
      ...base,
      ...getElementCenter(target.element),
      message: target.message,
    };
  }

  return {
    ...base,
    message: target.message,
    x: target.x,
    y: target.y,
  };
};

export const triggerSuccessFeedback = (target?: SuccessFeedbackTarget) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<SuccessFeedbackPayload>(SUCCESS_FEEDBACK_EVENT, {
      detail: resolvePayload(target),
    })
  );
};

export const useSuccessFeedback = () => {
  return useCallback((target?: SuccessFeedbackTarget) => {
    triggerSuccessFeedback(target);
  }, []);
};
