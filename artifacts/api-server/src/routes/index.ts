import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pushRouter from "./push";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pushRouter);
router.use(analyticsRouter);

export default router;
