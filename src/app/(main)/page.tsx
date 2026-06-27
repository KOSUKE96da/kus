// This file intentionally redirects to the root which is served by app/page.tsx.
// Having both app/page.tsx and app/(main)/page.tsx resolve to "/" causes a conflict.
// The home article list is rendered in app/page.tsx using MainLayoutClient + HomeContent.
export { default } from "../page";
