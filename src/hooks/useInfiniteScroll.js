import { useEffect, useRef } from "react";

// Put the returned ref on an empty element at the bottom of the list.
// When it comes within `rootMargin` of the screen, the next page is requested.
export function useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin = "600px" }) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !hasNextPage) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
            },
            { rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);

    return ref;
}