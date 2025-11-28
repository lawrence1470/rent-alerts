"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

// Custom indigo-slate primary color matching the current design
const brand: MantineColorsTuple = [
  "#f0f1ff",
  "#dcdff7",
  "#b5bbee",
  "#8b94e5",
  "#6973de",
  "#545fda",
  "#4854d9",
  "#3944c1",
  "#313cad",
  "#253399",
];

export const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand,
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
  },
  fontFamily:
    "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily:
      "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  },
  radius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.625rem",
    xl: "1rem",
  },
  defaultRadius: "md",
  cursorType: "pointer",
  focusRing: "auto",
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        withBorder: true,
      },
    },
    Input: {
      defaultProps: {
        radius: "md",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        centered: true,
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
    Badge: {
      defaultProps: {
        radius: "md",
      },
    },
    Notification: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
