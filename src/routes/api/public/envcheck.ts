import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/envcheck")({
  server: {
    handlers: {
      GET: async () => {
        const keys = Object.keys(process.env ?? {}).filter((k) => /SUPABASE|LPK/i.test(k));
        return Response.json({ keys, count: Object.keys(process.env ?? {}).length });
      },
    },
  },
});
