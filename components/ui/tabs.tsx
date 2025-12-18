import * as React from "react"
import { cn } from "../../lib/utils"

const TabsContext = React.createContext<{value: string, onValueChange: (v: string) => void} | null>(null);

export const Tabs = ({ value, onValueChange, children, className }: any) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
        <div className={className}>{children}</div>
    </TabsContext.Provider>
)

export const TabsList = ({ className, children }: any) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 w-full overflow-x-auto", className)}>
        {children}
    </div>
)

export const TabsTrigger = ({ value, children, className }: any) => {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx?.value === value;
    return (
        <button
            onClick={() => ctx?.onValueChange(value)}
            className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            isActive ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200/50 hover:text-slate-900",
            className)}
        >
            {children}
        </button>
    )
}

export const TabsContent = ({ value, children }: any) => {
    const ctx = React.useContext(TabsContext);
    if (ctx?.value !== value) return null;
    return <div>{children}</div>
}