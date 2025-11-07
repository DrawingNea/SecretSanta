import * as React from "react";

export function useSearchParam(key: string) {
  const [value, setValue] = React.useState<string | null>(null);
  React.useEffect(() => {
    const read = () => setValue(new URLSearchParams(window.location.search).get(key));
    read();
    const onPop = () => read();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [key]);
  return value;
}
