import { useState, type SubmitEvent } from "react";
import type { CreateEventInput, GameTemplate } from "../types";

interface Props {
  templates: GameTemplate[];
  onSubmit: (input: CreateEventInput) => void;
}

type Errors = Partial<Record<keyof CreateEventInput, string>>;

const defaultsFor = (t: GameTemplate) => {
  return {
    gameId: t.id,
    format: t.formats[0],
    durationMinutes: t.defaultDurationMinutes,
    capacity: t.defaultCapacity,
  };
}

export const EventForm = ({ templates, onSubmit }: Props) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [fields, setFields] = useState(() => defaultsFor(templates[0]));
  const [errors, setErrors] = useState<Errors>({});

  const template = templates.find((t) => t.id === fields.gameId)!;

  // Changing the game resets every template-driven field to that game's defaults.
  const  handleGameChange = (gameId: string) => {
    const next = templates.find((t) => t.id === gameId)!;
    setFields(defaultsFor(next));
    setErrors({});
  }

  const  validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Event name is required.";
    if (!startDate) e.startDate = "Pick a date.";
    if (!startTime) e.startTime = "Pick a start time.";
    if (!Number.isInteger(fields.capacity) || fields.capacity < 1) {
      e.capacity = "Capacity must be a whole number of at least 1.";
    } else if (fields.capacity > template.maxCapacity) {
      e.capacity = `${template.name} events allow at most ${template.maxCapacity} players.`;
    } else if (fields.capacity < template.minPlayers) {
      e.capacity = `Capacity can't be below the minimum of ${template.minPlayers} players to start.`;
    }
    if (!Number.isInteger(fields.durationMinutes) || fields.durationMinutes < 15) {
      e.durationMinutes = "Duration must be at least 15 minutes.";
    }
    return e;
  }

  const handleSubmit = (ev: SubmitEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ name: name.trim(), startDate, startTime, ...fields });
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 480, display: "grid", gap: 16 }}>
      <h2>Create event</h2>

      <label>
        Event name
        <input value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <span role="alert">{errors.name}</span>}
      </label>

      <label>
        Game
        <select value={fields.gameId} onChange={(e) => handleGameChange(e.target.value)}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <label>
        Format
        <select
          value={fields.format}
          onChange={(e) => setFields({ ...fields, format: e.target.value })}
        >
          {template.formats.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label>
          Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          {errors.startDate && <span role="alert">{errors.startDate}</span>}
        </label>
        <label>
          Start time
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          {errors.startTime && <span role="alert">{errors.startTime}</span>}
        </label>
      </div>

      <label>
        Duration (minutes)
        <input
          type="number"
          value={fields.durationMinutes}
          onChange={(e) => setFields({ ...fields, durationMinutes: e.target.valueAsNumber })}
        />
        {errors.durationMinutes && <span role="alert">{errors.durationMinutes}</span>}
      </label>

      <label>
        Player capacity
        <input
          type="number"
          min={1}
          max={template.maxCapacity}
          value={fields.capacity}
          onChange={(e) => setFields({ ...fields, capacity: e.target.valueAsNumber })}
        />
        <small>
          Max {template.maxCapacity} · needs {template.minPlayers}+ players to start
        </small>
        {errors.capacity && <span role="alert">{errors.capacity}</span>}
      </label>

      <button type="submit">Create event</button>
    </form>
  );

}