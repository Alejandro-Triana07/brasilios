import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { autenticar } from '../middlewares/auth.middleware';
import {
  validar,
  loginSchema,
  registroSchema,          // ← agrega esta línea
  solicitarRecuperacionSchema,
  verificarCodigoSchema,
  resetearPasswordSchema,
} from '../middlewares/validar.middleware';

const router = Router();

router.post('/register',            validar(registroSchema),              AuthController.registro);
router.post('/login',               validar(loginSchema),                 AuthController.login);
router.post('/logout',              autenticar,                           AuthController.logout);
router.post('/recuperar',           validar(solicitarRecuperacionSchema), AuthController.solicitarRecuperacion);
router.post('/recuperar/verificar', validar(verificarCodigoSchema),       AuthController.verificarCodigo);
router.post('/recuperar/reset',     validar(resetearPasswordSchema),      AuthController.resetearPassword);

export default router;