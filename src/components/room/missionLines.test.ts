import { describe, expect, it } from "vitest";
import { missionChannelLine, missionGreeting, missionSignLine, newMissionLine, type MissionMoment } from "./missionLines";

const base: MissionMoment = { title: "Oito seguidos", game: "Guerra de Lanche", state: "new", minutesLeft: 600, position: null };

describe("mascot lines for the daily mission", () => {
  it("announces a mission nobody tried yet and says where to find it", () => {
    expect(missionGreeting(base)).toEqual({ text: "Plantão! A Missão 404 de hoje é “Oito seguidos”, no Guerra de Lanche. Clica na placa NO AR.", expression: "excited" });
  });

  it("cheers a player who already tried", () => {
    expect(missionGreeting({ ...base, state: "started" }).text).toBe("A missão “Oito seguidos” ainda tá valendo. Mais uma tentativa?");
  });

  it("celebrates a completed mission, with the day's place when there is one", () => {
    expect(missionGreeting({ ...base, state: "completed", position: 3 }).text).toBe("Missão de hoje cumprida! Você tá em 3º no placar do dia.");
    expect(missionGreeting({ ...base, state: "completed" }).text).toBe("Missão de hoje cumprida! Amanhã tem outra.");
  });

  it("warns in the last hour, and hints at the next mission once this one is done", () => {
    expect(missionGreeting({ ...base, minutesLeft: 42 })).toMatchObject({ text: "Corre! A missão “Oito seguidos” sai do ar em 42 minutos.", expression: "surprised" });
    expect(missionGreeting({ ...base, state: "started", minutesLeft: 1 }).text).toContain("em 1 minuto.");
    expect(missionGreeting({ ...base, state: "completed", minutesLeft: 20 }).text).toBe("Missão de hoje cumprida. Daqui a pouco entra missão nova no ar!");
  });

  it("has short lines for the sign, the channel and a new day", () => {
    expect(missionSignLine(base).text).toBe("No ar: “Oito seguidos”. Clica na tela pra jogar!");
    expect(missionSignLine({ ...base, state: "completed" }).text).toBe("Essa você já cumpriu! Mas dá pra subir no placar do dia.");
    expect(missionChannelLine(base, "09")).toBe("Canal 09: plantão da Missão 404! Hoje é “Oito seguidos”.");
    expect(newMissionLine(base).text).toBe("Virou o dia! Missão nova no ar: “Oito seguidos”.");
    for (const line of [missionGreeting(base), missionSignLine(base), newMissionLine(base)]) expect(line.text.length).toBeLessThanOrEqual(110);
  });
});
