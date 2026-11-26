import { useEffect, useEffectEvent, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { snapPoint, type Coordinates, type DraftField, type MapPoint } from "./geometry";

export type Tool = "select" | "pan" | "boundary" | "plant" | "pole";

type Props = {
  field: DraftField;
  tool: Tool;
  selectedId: string | null;
  location: Coordinates | null;
  onPlace: (position: Coordinates) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, position: Coordinates) => void;
};

const boundaryStyle = { color: "#285e48", weight: 3, fillOpacity: 0.12, interactive: false };
const guideStyle = { color: "#8b28b5", weight: 2, dashArray: "5 4", interactive: false };

export function FieldMapCanvas({
  field,
  tool,
  selectedId,
  location,
  onPlace,
  onSelect,
  onMove,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const activeDrag = useRef<(() => void) | null>(null);
  const spaceHeld = useRef(false);
  const ctrlHeld = useRef(false);

  const place = useEffectEvent((event: L.LeafletMouseEvent) => {
    if (!spaceHeld.current && tool !== "pan") onPlace(event.latlng);
  });
  const select = useEffectEvent((id: string) => onSelect(id));
  const move = useEffectEvent((id: string, position: Coordinates) => onMove(id, position));
  const fitField = useEffectEvent((map: L.Map) => {
    const points = [...field.boundary, ...field.objects];
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 20 });
  });

  useEffect(() => {
    const element = container.current!;
    const map = L.map(element, { maxZoom: 23, doubleClickZoom: false }).setView([46.67, 11.16], 16);
    mapRef.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxNativeZoom: 19,
      maxZoom: 23,
      referrerPolicy: "strict-origin-when-cross-origin",
    }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    map.on("click", place);

    // Leaflet handles panning. Space temporarily lets the map receive drags through the markers.
    function keyDown(event: KeyboardEvent) {
      if (event.key === "Control") {
        ctrlHeld.current = true;
        activeDrag.current?.();
      }
      if (event.code !== "Space" || event.defaultPrevented) return;
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input, select, textarea, [contenteditable]")
      ) {
        return;
      }
      if (!element.matches(":hover") && !element.contains(document.activeElement)) return;
      event.preventDefault();
      spaceHeld.current = true;
      element.classList.add("field-map-space");
    }

    function keyUp(event: KeyboardEvent) {
      if (event.key === "Control") {
        ctrlHeld.current = false;
        activeDrag.current?.();
      }
      if (event.code === "Space") {
        spaceHeld.current = false;
        element.classList.remove("field-map-space");
      }
    }

    function resetKeys() {
      spaceHeld.current = false;
      ctrlHeld.current = false;
      element.classList.remove("field-map-space");
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", resetKeys);
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize?.observe(element);
    return () => {
      resize?.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", resetKeys);
      resetKeys();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const fieldId = field.id;
  useEffect(() => {
    const map = mapRef.current;
    if (map) fitField(map);
  }, [fieldId]);

  useEffect(() => {
    if (location) mapRef.current?.setView(location, 19, { animate: false });
  }, [location]);

  const { boundary, closed, objects } = field;
  useEffect(() => {
    const map = mapRef.current!;
    const layers = L.layerGroup().addTo(map);
    const outline = (
      closed ? L.polygon(boundary, boundaryStyle) : L.polyline(boundary, boundaryStyle)
    ).addTo(layers);
    const guides = L.layerGroup().addTo(layers);
    const points = [...boundary, ...objects];

    function addMarker(point: MapPoint, kind: "corner" | "plant" | "pole", label: string) {
      const size = kind === "corner" ? 14 : 22;
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: `field-map-marker field-map-${kind}`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        title: label,
        draggable: true,
      }).addTo(layers);
      marker.getElement()?.setAttribute("aria-label", label);
      markers.current.set(point.id, marker);
      marker.on("click", () => select(point.id));

      let raw = marker.getLatLng();
      let anchors: Coordinates[] = [];
      function updatePosition() {
        const size = map.getSize();
        const current = map.latLngToContainerPoint(raw);
        const targets = ctrlHeld.current
          ? []
          : anchors
              .map((anchor) => map.latLngToContainerPoint(anchor))
              .filter(({ x, y }) => x >= 0 && x <= size.x && y >= 0 && y <= size.y);
        const { position, vertical, horizontal } = snapPoint(current, targets);
        guides.clearLayers();
        if (vertical !== undefined) {
          L.polyline(
            [
              map.containerPointToLatLng([vertical, 0]),
              map.containerPointToLatLng([vertical, size.y]),
            ],
            guideStyle,
          ).addTo(guides);
        }
        if (horizontal !== undefined) {
          L.polyline(
            [
              map.containerPointToLatLng([0, horizontal]),
              map.containerPointToLatLng([size.x, horizontal]),
            ],
            guideStyle,
          ).addTo(guides);
        }
        const coordinates =
          vertical !== undefined || horizontal !== undefined
            ? map.containerPointToLatLng([position.x, position.y])
            : raw;
        marker.setLatLng(coordinates);
        if (kind === "corner") {
          outline.setLatLngs(
            boundary.map((corner) => (corner.id === point.id ? coordinates : corner)),
          );
        }
      }
      marker.on("dragstart", () => {
        anchors = points.filter((anchor) => anchor.id !== point.id);
        activeDrag.current = updatePosition;
      });
      marker.on("drag", (event) => {
        raw = marker.getLatLng();
        const { originalEvent: original } = event as L.LeafletEvent & {
          originalEvent?: MouseEvent | TouchEvent;
        };
        if (original) ctrlHeld.current = original.ctrlKey;
        updatePosition();
      });
      marker.on("dragend", () => {
        guides.clearLayers();
        activeDrag.current = null;
        anchors = [];
        move(point.id, marker.getLatLng());
      });
    }

    boundary.forEach((point, index) => addMarker(point, "corner", `Boundary corner ${index + 1}`));
    const counts = { plant: 0, pole: 0 };
    objects.forEach((point) => {
      const name = point.kind === "plant" ? "Plant" : "Pole";
      addMarker(point, point.kind, `${name} ${++counts[point.kind]}`);
    });

    const markerIndex = markers.current;
    return () => {
      activeDrag.current = null;
      markerIndex.clear();
      layers.remove();
    };
  }, [boundary, closed, objects]);

  useEffect(() => {
    for (const [id, marker] of markers.current) {
      const selected = id === selectedId;
      const element = marker.getElement();
      marker.setZIndexOffset(selected ? 1000 : 0);
      element?.classList.toggle("field-map-marker-selected", selected);
      element?.setAttribute("aria-pressed", String(selected));
    }
  }, [boundary, closed, objects, selectedId]);

  return (
    <div
      ref={container}
      className="field-map-canvas"
      data-tool={tool}
      role="region"
      aria-label="Field map canvas"
    />
  );
}
