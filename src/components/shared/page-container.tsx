import React from 'react';
import { useTheme } from './theme-provider';



interface PageContainerProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, subtitle, children }) => {
    const { theme } = useTheme();

  return (
    <div className="space-y-6 px-4">
      <div className={`py-4 bg-background text-foreground rounded-lg sm:rounded-xl ${theme !== "light" ? "border border-border" : ""} shadow-sm`}>
          <div className="px-4">
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-2xl font-bold mb-1 sm:mb-2">{title}</h3>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">{subtitle}</p>}
          </div>
      </div>
      {children}
    </div>
  );
};

export default PageContainer;
