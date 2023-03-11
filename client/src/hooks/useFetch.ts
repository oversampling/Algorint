import React, { useCallback, useEffect, useState } from "react";

export default function<Type>(url: string, method: string, body: any): [Type | undefined, boolean, (url: string, method: string, body: any) => Promise<void>] {
  const [data, setData] = useState<Type>();
  const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchData() {
            if (method === "GET" || method === "get"){
                const res = await fetch(url, {
                    method: method,
                });
                const json = await res.json();
                setData(json);
                setLoading(false);
            }else{
                const res = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                });
                const json: Type = await res.json();
                setData(json);
                setLoading(false);
            }
        }
        if (method !== "" && url !== ""){
            fetchData();
        }
    }, [url, method, body]);

    const fetchData = useCallback(async (url: string, method: string, body: any) => {
        setLoading(true);
        if (method === "GET" || method === "get"){
            const res = await fetch(url, {
                method: method,
            });
            const json = await res.json();
            setData(json);
            setLoading(false);
        }else{
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            const json: Type = await res.json();
            setData(json);
            setLoading(false);
        }
    }, [url, method, body]);

  return [ data, loading, fetchData] ;
}
