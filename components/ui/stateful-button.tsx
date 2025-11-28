"use client";

import * as React from "react";
import { Button, ButtonProps } from "@mantine/core";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";

export interface StatefulButtonProps extends Omit<ButtonProps, "children"> {
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  state?: "idle" | "loading" | "success" | "error";
  showIcon?: boolean;
  autoResetDelay?: number; // Auto reset to idle after success/error (in ms)
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function StatefulButton({
  children,
  loadingText,
  successText,
  errorText,
  state = "idle",
  showIcon = true,
  autoResetDelay,
  disabled,
  className,
  variant,
  ...props
}: StatefulButtonProps) {
  const [currentState, setCurrentState] = React.useState(state);

  React.useEffect(() => {
    setCurrentState(state);
  }, [state]);

  React.useEffect(() => {
    if (autoResetDelay && (currentState === "success" || currentState === "error")) {
      const timer = setTimeout(() => {
        setCurrentState("idle");
      }, autoResetDelay);
      return () => clearTimeout(timer);
    }
  }, [currentState, autoResetDelay]);

  const getButtonContent = () => {
    switch (currentState) {
      case "loading":
        return (
          <>
            {showIcon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingText || children}
          </>
        );
      case "success":
        return (
          <>
            {showIcon && <Check className="mr-2 h-4 w-4" />}
            {successText || "Success!"}
          </>
        );
      case "error":
        return (
          <>
            {showIcon && <X className="mr-2 h-4 w-4" />}
            {errorText || "Error"}
          </>
        );
      default:
        return children;
    }
  };

  const getButtonColor = () => {
    switch (currentState) {
      case "success":
        return "green";
      case "error":
        return "red";
      default:
        return undefined;
    }
  };

  return (
    <Button
      disabled={disabled || currentState === "loading"}
      variant={variant || "filled"}
      color={getButtonColor()}
      className={cn(className, "transition-all duration-200")}
      {...props}
    >
      {getButtonContent()}
    </Button>
  );
}

// Hook for managing stateful button state
export function useStatefulButton(autoResetDelay?: number) {
  const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const setLoading = React.useCallback(() => setState("loading"), []);
  const setSuccess = React.useCallback(() => {
    setState("success");
    if (autoResetDelay) {
      setTimeout(() => setState("idle"), autoResetDelay);
    }
  }, [autoResetDelay]);
  const setError = React.useCallback(() => {
    setState("error");
    if (autoResetDelay) {
      setTimeout(() => setState("idle"), autoResetDelay);
    }
  }, [autoResetDelay]);
  const reset = React.useCallback(() => setState("idle"), []);

  return { state, setLoading, setSuccess, setError, reset };
}