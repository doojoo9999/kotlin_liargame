// Minimal sheet (drawer) stub for dependency resolution (Step2)
import React from 'react';

export interface SheetProps { children?: React.ReactNode }
export const Sheet: React.FC<SheetProps> = ({children}) => <div data-component="sheet">{children}</div>;
export const SheetTrigger: React.FC<{children?: React.ReactNode}> = ({children}) => <button type="button">{children}</button>;
export const SheetContent: React.FC<{children?: React.ReactNode; side?: string}> = ({children}) => <div>{children}</div>;

