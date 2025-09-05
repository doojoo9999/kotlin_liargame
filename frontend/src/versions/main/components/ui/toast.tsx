// Minimal toast stub
import React from 'react';

export interface ToastProps { message?: string }
export const Toast: React.FC<ToastProps> = ({message}) => <div role="status" data-component="toast">{message}</div>;
export const useToast = () => ({ push: (m: string) => console.log('[toast]', m) });

