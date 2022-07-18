import http, { IncomingMessage, ServerResponse } from "node:http";
import Router from "./Router/Router";

const port = process.env.PORT || 5000;
const router = new Router();

const defaultHandle = (_: IncomingMessage, response: ServerResponse) => {
  response.statusCode = 200;
  response.end("OK");
};

router.get("/", (_, res) => res.end("root route"));
router.get("/client/*", (_, res) => res.end("Wildcard"));

router.get("/user", defaultHandle);

router.get("/user/login", (_, res) => res.end("User login"));
router.get("/user/:userId", (_, res) => res.end("Parametric without / end"));
router.get("/user/:tokenId/token", (_, res) => res.end("Parametric"));
router.get("/user/:userId/:tokenId", (_, res) =>
  res.end("Multiple parametric")
);
router.get("/user/:id/token/*", (_, res) => res.end("Parametric w/ wildcard"));
router.get("/user/:id/:token/*", (_, res) =>
  res.end("Multiple parametric w/ wildcard")
);

const adminRoutes = new Router();
adminRoutes.get("/", (_, res) => res.end("Admin"));
adminRoutes.get("/:userId/data", (_, res) => res.end("Parametric admin"));
adminRoutes.get("/:userId", (_, res) =>
  res.end("Parametric admin without / end")
);
adminRoutes.get("/profile/data/*", (_, res) => res.end("Wildcard admin"));
adminRoutes.get("/:tokenId/:profileId", (_, res) =>
  res.end("Multiple parametric admin")
);

router.use("/admin", adminRoutes);

const server = http.createServer((request, response) => {
  router.lookup(request, response);
});

server.listen(port, () => console.log("Server listing at", port));
