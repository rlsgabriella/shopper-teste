import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { GoogleGenerativeAI } from '@google/generative-ai';

import { LeituraResposta } from '../db';

export const router = Router();
const API_KEY = process.env.GEMINI_API_KEY || "";
router.post("/upload", async (req, res) => {
  const { image, customer_code, measure_datetime, measure_type } = req.body;
  if (image && customer_code && measure_datetime && measure_type) {
    const leitura = JSON.stringify(req.body);

    const leituraBanco = await LeituraResposta.findAll({
      where: {
        leitura: leitura,
      },
    });

    if (leituraBanco.length > 0) {
      res.status(409).json({
        error_code: "DOUBLE_REPORT",
        error_description: "Leitura do mês já realizada",
      });
    } else {
      // https://github.com/google-gemini/generative-ai-js
      const genAI = new GoogleGenerativeAI(API_KEY || "");
      const model = genAI.getGenerativeModel({
        // Choose a Gemini model.
        model: "gemini-1.5-flash",
      });
      const prompt =
        "Quero o número da leitura de água, eu quero apenas o número, sem nenhum texto.";
      const imageParam = {
        inlineData: {
          data: image,
          mimeType: "image/png",
        },
      };

      const result = await model.generateContent([prompt, imageParam]);

      const resposta = result.response.text();

      const criarNovaLeituraResposta = {
        measure_uuid: uuidv4(),
        leitura: leitura,
        resposta: Number(resposta),
        customer_code: customer_code,
        measure_type: measure_type,
      };

      await LeituraResposta.create(criarNovaLeituraResposta);

      res.json({
        measure_uuid: criarNovaLeituraResposta.measure_uuid,
        resposta: criarNovaLeituraResposta.resposta,
      });
    }
  } else {
    res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "dados inválidos",
    });
  }
});

router.patch("/confirm", async (req, res) => {
  const { measure_uuid, confirmed_value } = req.body;

  if (typeof confirmed_value !== "number") {
    res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "`confirmed_value` deve ser um número",
    });

    return;
  }
  if (Number(confirmed_value) <= 0) {
    res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "`confirmed_value` deve ser um número maior que zero.",
    });

    return;
  }

  const resultado = await LeituraResposta.findOne({
    where: {
      measure_uuid: measure_uuid,
    },
  });
  if (!resultado) {
    res.status(404).json({
      error_code: "error_code",
      error_description: "Leitura do mês já realizada",
    });
    return;
  }

  await LeituraResposta.update(
    { confirmed_value: confirmed_value },
    { where: { measure_uuid: measure_uuid } }
  );
  res.json({});
});

router.get("/:customer_code/list", async (req, res) => {
  const { customer_code } = req.params;

  const { measure_type } = req.query;

  if (customer_code === undefined) {
    res.status(400).json({});
    return;
  }

  if (
    measure_type === "WATER" ||
    measure_type === "GAS" ||
    measure_type === undefined
  ) {
    try {
      const resultado = await LeituraResposta.findAll({
        where: {
          customer_code: customer_code,
          measure_type: measure_type,
        },
      });

      if (resultado.length === 0) {
        res.status(404).json({
          error_code: "MEASURES_NOT_FOUND",
          error_description: "Nenhuma leitura foi encontrada",
        });
        return;
      } else {
        console.log("resultado", resultado);

        res.json(resultado);
        return;
      }
    } catch (error) {
      console.log("error", error);
      res.status(400).json(error);
      return;
    }
  } else {
    res.status(400).json({
      error_code: "INVALID_TYPE",
      error_description: "Tipo de medição não permitida",
    });
    return;
  }
});
