import React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster(props) {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'white',
          color: '#333',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }}
      {...props}
    />
  );
}

