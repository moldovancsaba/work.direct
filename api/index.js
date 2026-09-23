// Vercel entry point: vercel.json rewrites every path here; src/app.js does the routing.
import app from "../src/app.js";

const handle = (request) => app.fetch(request, process.env);

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS };
