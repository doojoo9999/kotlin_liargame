// Minimal dropdown-menu stub
import React from 'react';

export const DropdownMenu: React.FC<{children?: React.ReactNode}> = ({children}) => <div data-component="dropdown-menu">{children}</div>;
export const DropdownMenuTrigger: React.FC<{children?: React.ReactNode}> = ({children}) => <button type="button">{children}</button>;
export const DropdownMenuContent: React.FC<{children?: React.ReactNode}> = ({children}) => <div>{children}</div>;
export const DropdownMenuItem: React.FC<{onSelect?: ()=>void; children?: React.ReactNode}> = ({onSelect, children}) => <div onClick={onSelect}>{children}</div>;

