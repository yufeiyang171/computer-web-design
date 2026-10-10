import { ComputerModel } from "./ComputerModel.jsx";

export function ComputerPreview() {
  return (
    <main className="model-preview-page">
      <div className="model-preview-shell">
        <ComputerModel />
      </div>
    </main>
  );
}
