import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pushRouter from "./push";
import analyticsRouter from "./analytics";
import aiRouter from "./ai";
import aiChatRouter from "./ai-chat";
import ttsRouter from "./tts";
import premiumRouter from "./premium";
import locationRouter from "./location";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pushRouter);
router.use(analyticsRouter);
router.use(aiRouter);
router.use(aiChatRouter);
router.use(ttsRouter);
router.use(premiumRouter);
router.use(locationRouter);
router.use(stripeRouter);

export default router;
