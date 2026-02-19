import { createServerFn } from "@tanstack/react-start";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getPunkSongs = createServerFn({
  method: "GET",
}).handler(async () => {
  // ⏳ simulate slow network / API
  // await delay(5000);

  return [
    { id: 1, name: "Teenage Dirtbag", artist: "Wheatus" },
    { id: 2, name: "Smells Like Teen Spirit", artist: "Nirvana" },
    { id: 3, name: "The Middle", artist: "Jimmy Eat World" },
    { id: 4, name: "My Own Worst Enemy", artist: "Lit" },
    { id: 5, name: "Fat Lip", artist: "Sum 41" },
    { id: 6, name: "All the Small Things", artist: "blink-182" },
    { id: 7, name: "Beverly Hills", artist: "Weezer" },
  ];
});
