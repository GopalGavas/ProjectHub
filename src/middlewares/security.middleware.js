import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import express from "express";

export const applySecurity = (app) => {
  app.use(cookieParser());
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(helmet());
  app.use(hpp());
};
