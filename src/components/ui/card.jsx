import React from 'react';

/** Granary-style surface: thin border, soft radius, no heavy shadow */
const Card = ({ className, ...props }) => {
  return (
    <div
      className={`rounded-[10px] border border-[#E5E7EB] bg-white text-card-foreground shadow-none dark:border-[#24352c] dark:bg-[#122018] ${className || ''}`}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-5 ${className || ''}`}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }) => {
  return (
    <h3
      className={`text-xl font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    />
  );
};

const CardDescription = ({ className, ...props }) => {
  return (
    <p
      className={`text-sm text-muted-foreground ${className || ''}`}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }) => {
  return (
    <div className={`p-5 pt-0 ${className || ''}`} {...props} />
  );
};

const CardFooter = ({ className, ...props }) => {
  return (
    <div
      className={`flex items-center p-5 pt-0 ${className || ''}`}
      {...props}
    />
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
