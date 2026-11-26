import { useState, type FormEvent } from "react";
import { Hand, MousePointer2, Pentagon, Sprout, UtilityPole } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { FieldMapCanvas, type Tool } from "./FieldMapCanvas";
import { generateGrid, type Coordinates, type DraftField, type ObjectKind } from "./geometry";
import "./field-editor.css";

const tools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "boundary", label: "Boundary", icon: Pentagon },
  { id: "plant", label: "Plant", icon: Sprout },
  { id: "pole", label: "Pole", icon: UtilityPole },
] as const;

const instructions: Record<Tool, string> = {
  select: "Select or drag a point on the map.",
  pan: "Drag the map to pan.",
  boundary: "Click the map to add boundary corners, then close the boundary.",
  plant: "Click the map to place a plant.",
  pole: "Click the map to place a pole.",
};

type Props = {
  fields: DraftField[];
  onChange: (update: (fields: DraftField[]) => DraftField[]) => void;
  onBack: () => void;
};

function draftId() {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

export default function FieldEditor({ fields, onChange, onBack }: Props) {
  const [fieldId, setFieldId] = useState(fields[0]!.id);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<ObjectKind>("plant");
  const [spacing, setSpacing] = useState("5");
  const [coordinateText, setCoordinateText] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState("");
  const [gridMessage, setGridMessage] = useState("");

  const field = fields.find((draft) => draft.id === fieldId)!;
  const corner = field.boundary.find((point) => point.id === selectedId);
  const object = field.objects.find((point) => point.id === selectedId);
  const selection = corner ?? object;
  const plantCount = field.objects.filter((point) => point.kind === "plant").length;

  function updateField(update: (draft: DraftField) => DraftField) {
    onChange((drafts) => drafts.map((draft) => (draft.id === fieldId ? update(draft) : draft)));
  }

  function selectField(id: string) {
    setFieldId(id);
    setSelectedId(null);
    setTool("select");
    setGridMessage("");
  }

  function addField() {
    const id = draftId();
    onChange((drafts) => [
      ...drafts,
      { id, name: `Field ${drafts.length + 1}`, closed: false, boundary: [], objects: [] },
    ]);
    selectField(id);
  }

  function place(position: Coordinates) {
    if (tool === "select") setSelectedId(null);
    if (tool === "select" || tool === "pan" || (tool === "boundary" && field.closed)) return;
    const point = { id: draftId(), lat: position.lat, lng: position.lng };
    if (tool === "boundary") {
      updateField((draft) => ({ ...draft, boundary: [...draft.boundary, point] }));
    } else {
      updateField((draft) => ({ ...draft, objects: [...draft.objects, { ...point, kind: tool }] }));
    }
    setSelectedId(point.id);
    setGridMessage("");
  }

  function move(id: string, { lat, lng }: Coordinates) {
    if (field.boundary.some((point) => point.id === id)) {
      updateField((draft) => ({
        ...draft,
        boundary: draft.boundary.map((point) => (point.id === id ? { ...point, lat, lng } : point)),
      }));
    } else {
      updateField((draft) => ({
        ...draft,
        objects: draft.objects.map((point) => (point.id === id ? { ...point, lat, lng } : point)),
      }));
    }
    setSelectedId(id);
    setGridMessage("");
  }

  function removeSelection() {
    if (corner) {
      updateField((draft) => {
        const boundary = draft.boundary.filter((point) => point.id !== selectedId);
        return { ...draft, boundary, closed: draft.closed && boundary.length >= 3 };
      });
    } else if (object) {
      updateField((draft) => ({
        ...draft,
        objects: draft.objects.filter((point) => point.id !== selectedId),
      }));
    }
    setSelectedId(null);
    setGridMessage("");
  }

  function addGrid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateGrid(field, kind, Number(spacing));
    if (result.error !== undefined) {
      setGridMessage(result.error);
      return;
    }
    const points = result.coordinates.map((position) => ({
      ...position,
      kind,
      id: draftId(),
    }));
    if (points.length === 0) {
      setGridMessage("This grid has no new points to add.");
      return;
    }
    updateField((draft) => ({ ...draft, objects: [...draft.objects, ...points] }));
    setTool("select");
    setSelectedId(null);
    setGridMessage(`Added ${points.length} ${kind}${points.length === 1 ? "" : "s"}.`);
  }

  function goToCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parts = coordinateText.split(",").map((part) => part.trim());
    const [lat, lng] = parts.map(Number);
    if (
      parts.length !== 2 ||
      parts.some((part) => !part) ||
      lat === undefined ||
      lng === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 85 ||
      Math.abs(lng) > 180
    ) {
      setLocationError("Enter a latitude from −85 to 85 and a longitude from −180 to 180.");
      return;
    }
    setLocationError("");
    setLocation({ lat, lng });
  }

  return (
    <main className="content field-editor">
      <header className="top field-editor-heading">
        <div>
          <h1>Field editor</h1>
          <p className="muted">Session drafts · cleared when you reload</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to overview
        </Button>
      </header>
      <div className="field-editor-layout">
        <Card className="field-editor-map">
          <div className="field-editor-tools" role="group" aria-label="Map tools">
            {tools.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={tool === id ? "default" : "ghost"}
                size="sm"
                aria-pressed={tool === id}
                onClick={() => setTool(id)}
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </Button>
            ))}
          </div>
          <FieldMapCanvas
            field={field}
            tool={tool}
            selectedId={selectedId}
            location={location}
            onPlace={place}
            onSelect={setSelectedId}
            onMove={move}
          />
          <div className="field-editor-hints">
            <span>
              {tool === "boundary" && field.closed
                ? "Drag a corner to edit the closed boundary."
                : instructions[tool]}
            </span>
            <span>
              <kbd>Space</kbd> pan · <kbd>Ctrl</kbd> disable snap
            </span>
          </div>
        </Card>
        <div className="field-editor-sidebar">
          <Card className="field-editor-panel">
            <h2>Field</h2>
            <div className="field-editor-row">
              <select
                aria-label="Draft field"
                value={fieldId}
                onChange={(event) => selectField(event.target.value)}
              >
                {fields.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.name.trim() || "Untitled field"}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={addField}>
                Add field
              </Button>
            </div>
            <label>
              Field name
              <input
                value={field.name}
                onChange={(event) => {
                  const name = event.target.value;
                  updateField((draft) => ({ ...draft, name }));
                }}
              />
            </label>
            <p className="muted">
              {field.boundary.length} corners · {plantCount} plants ·{" "}
              {field.objects.length - plantCount} poles
            </p>
            {field.closed ? null : (
              <Button
                size="sm"
                variant="outline"
                disabled={field.boundary.length < 3}
                onClick={() => {
                  updateField((draft) => ({ ...draft, closed: true }));
                  setTool("select");
                  setGridMessage("");
                }}
              >
                Close boundary
              </Button>
            )}
          </Card>
          <Card className="field-editor-panel">
            <h2>Object grid</h2>
            <form onSubmit={addGrid}>
              <div className="field-editor-row">
                <label>
                  Object
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value === "pole" ? "pole" : "plant")}
                  >
                    <option value="plant">Plants</option>
                    <option value="pole">Poles</option>
                  </select>
                </label>
                <label>
                  Spacing (m)
                  <input
                    type="number"
                    step="any"
                    value={spacing}
                    onChange={(event) => setSpacing(event.target.value)}
                  />
                </label>
              </div>
              <p className="muted">The grid follows the first boundary edge.</p>
              <Button type="submit" size="sm" disabled={!field.closed}>
                Generate grid
              </Button>
              <p className="muted" role="status">
                {gridMessage}
              </p>
            </form>
          </Card>
          {selection && (
            <Card className="field-editor-panel">
              <h2>{corner ? "Boundary corner" : object?.kind === "pole" ? "Pole" : "Plant"}</h2>
              <p className="muted">
                {selection.lat.toFixed(6)}, {selection.lng.toFixed(6)}
              </p>
              <Button size="sm" variant="outline" onClick={removeSelection}>
                Remove selected point
              </Button>
            </Card>
          )}
          <Card className="field-editor-panel">
            <h2>Map location</h2>
            <form onSubmit={goToCoordinates}>
              <label>
                Latitude, longitude
                <input
                  value={coordinateText}
                  placeholder="46.6700, 11.1600"
                  onChange={(event) => setCoordinateText(event.target.value)}
                />
              </label>
              <Button type="submit" size="sm" variant="outline">
                Go to coordinates
              </Button>
              {locationError && (
                <p className="muted" role="alert">
                  {locationError}
                </p>
              )}
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
