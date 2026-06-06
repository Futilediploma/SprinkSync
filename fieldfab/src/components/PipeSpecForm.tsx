/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { PIPE_TYPES, OUTLET_TYPES, FITTING_TYPES } from "../data/pipeOptions";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import type { Piece } from "../types";

type PipeSpecFormProps = {
  onCreatePiece?: (piece: Piece) => void;
  onCancel?: () => void;
  initialValues?: Partial<Piece>;
};

function parseInches(val: string) {
  if (!val) return 0;
  if (/^\d+(\.\d+)?$/.test(val)) return parseFloat(val);
  if (/^\d+\/\d+$/.test(val)) {
    const [num, denom] = val.split("/").map(Number);
    return denom ? num / denom : 0;
  }
  if (/^\d+ \d+\/\d+$/.test(val)) {
    const [whole, frac] = val.split(" ");
    const [num, denom] = frac.split("/").map(Number);
    return parseInt(whole) + (denom ? num / denom : 0);
  }
  return NaN;
}

const DIAMETER_OPTIONS = [
  '1"',
  '1 1/4"',
  '1 1/2"',
  '2"',
  '2 1/2"',
  '3"',
  '4"',
  '6"',
  '8"',
  '10"',
  '12"',
];

const pipeSpecSchema = z.object({
  qty: z.coerce.number().min(1, "Quantity required"),
  feet: z.coerce.number().min(0, "Feet required"),
  inches: z.coerce.string().refine(
    (val) => {
      const parsed = parseInches(val);
      return !isNaN(parsed) && parsed >= 0 && parsed < 12;
    },
    { message: "Inches must be 0-11, decimal or fraction (e.g. 3.5 or 1/2)" }
  ),
  diameter: z.string().min(1, "Diameter required"),
  pipeType: z.string().min(1, "Select a pipe type"),
  outletType: z.string().min(1, "Select an outlet type"),
  fittingsEnd1: z.string().optional(),
  fittingsEnd2: z.string().optional(),
  notes: z.string().optional(),
  pipeTag: z.string().optional(),
});

type PipeSpecFormValues = z.input<typeof pipeSpecSchema>;

const inputSurfaceSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#f5f9ff",
    "& fieldset": { borderColor: "#c8d7ec" },
    "&:hover fieldset": { borderColor: "#8aa9d0" },
    "&.Mui-focused fieldset": { borderColor: "#2a6fbb", borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": { color: "#4a5f7d", fontWeight: 600 },
  "& .MuiInputBase-input": { color: "#17253b" },
  "& .MuiFormHelperText-root": { marginLeft: "2px" },
};

function PipeSpecForm({ onCreatePiece, onCancel, initialValues }: PipeSpecFormProps) {
  const {
    control,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PipeSpecFormValues>({
    resolver: zodResolver(pipeSpecSchema),
    mode: "onBlur",
    defaultValues: {
      qty: Number(initialValues?.qty ?? 1),
      feet: Number(initialValues?.feet ?? 0),
      inches: initialValues?.inches ?? "",
      diameter: initialValues?.diameter ?? '1"',
      pipeType: initialValues?.pipeType ?? "",
      outletType: "",
      fittingsEnd1: initialValues?.fittingsEnd1 ?? "",
      fittingsEnd2: initialValues?.fittingsEnd2 ?? "",
      notes: "",
      pipeTag: initialValues?.pipeTag ?? "",
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      setValue("qty", Number(initialValues.qty ?? 1));
      setValue("feet", Number(initialValues.feet ?? 0));
      setValue("inches", initialValues.inches ?? "");
      setValue("diameter", initialValues.diameter ?? '1"');
      setValue("pipeType", initialValues.pipeType ?? "");
      setValue("outletType", "");
      setValue("fittingsEnd1", initialValues.fittingsEnd1 ?? "");
      setValue("fittingsEnd2", initialValues.fittingsEnd2 ?? "");
      setValue("pipeTag", initialValues.pipeTag ?? "");
    }
  }, [initialValues, setValue]);

  const feetRaw = watch("feet");
  const feet = typeof feetRaw === "number" ? feetRaw : Number(feetRaw ?? 1);
  const inchesRaw = watch("inches");
  const pipeType = watch("pipeType") ?? "schedule_40";
  const diameter = watch("diameter") ?? '1"';
  const sketchContainerRef = useRef<HTMLDivElement>(null);

  return (
    <Box maxWidth="100%" width="100%" mx="auto" sx={{ backgroundColor: "transparent", p: 0, borderRadius: 3, boxShadow: "none" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.72rem",
            color: "#2a6fbb",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Fabrication Intake
        </div>
        <h2 style={{ fontWeight: 900, fontSize: "2rem", margin: "6px 0", color: "#1a2233", letterSpacing: 0.5 }}>Pipe Specification</h2>
        <div style={{ fontWeight: 500, fontSize: "0.92rem", color: "#43556f", marginBottom: 8 }}>Add core pipe details for your shop sheet.</div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }}>
        <div style={{ marginBottom: 12 }}>
          <TextField label="Pipe Tag" type="text" fullWidth {...register("pipeTag")} sx={{ mb: 2, ...inputSurfaceSx }} />

          <TextField
            label="Quantity (pcs)"
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
            {...register("qty", { valueAsNumber: true })}
            error={!!errors.qty}
            helperText={errors.qty?.message as string}
            sx={{ mb: 2, ...inputSurfaceSx }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Feet"
              type="number"
              inputProps={{ min: 0 }}
              fullWidth
              {...register("feet", { valueAsNumber: true })}
              error={!!errors.feet}
              helperText={errors.feet?.message as string}
              sx={inputSurfaceSx}
            />
            <TextField
              label="Inches (decimals or fractions)"
              type="text"
              inputMode="decimal"
              fullWidth
              {...register("inches")}
              error={!!errors.inches}
              helperText={errors.inches?.message as string}
              sx={inputSurfaceSx}
            />
          </Stack>

          <Controller
            name="diameter"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={DIAMETER_OPTIONS}
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue ?? "")}
                onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Diameter (inches)"
                    error={!!errors.diameter}
                    helperText={errors.diameter?.message as string}
                    placeholder={'Type or select e.g. 1", 2 1/2", 4"'}
                    sx={{ mb: 2, ...inputSurfaceSx }}
                  />
                )}
              />
            )}
          />

          <Controller
            name="pipeType"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={PIPE_TYPES.map((pt) => pt.label)}
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue ?? "")}
                onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pipe Type"
                    error={!!errors.pipeType}
                    helperText={errors.pipeType?.message as string}
                    placeholder="Type to search pipe types"
                    sx={{ mb: 2, ...inputSurfaceSx }}
                  />
                )}
              />
            )}
          />

          <Controller
            name="outletType"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={OUTLET_TYPES.map((ot) => ot.label)}
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue ?? "")}
                onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Default Outlet Type"
                    error={!!errors.outletType}
                    helperText={errors.outletType?.message as string}
                    placeholder="Type to search outlet types"
                    sx={{ mb: 2, ...inputSurfaceSx }}
                  />
                )}
              />
            )}
          />

          <Controller
            name="fittingsEnd1"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={FITTING_TYPES.map((ft) => ft.label)}
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue ?? "")}
                onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pipe End 1"
                    placeholder="Type to search pipe end types"
                    sx={{ mb: 2, ...inputSurfaceSx }}
                  />
                )}
              />
            )}
          />

          <Controller
            name="fittingsEnd2"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={FITTING_TYPES.map((ft) => ft.label)}
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue ?? "")}
                onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pipe End 2"
                    placeholder="Type to search pipe end types"
                    sx={{ mb: 2, ...inputSurfaceSx }}
                  />
                )}
              />
            )}
          />

          <TextField
            label="Special Notes/Instructions"
            type="text"
            fullWidth
            multiline
            minRows={2}
            {...register("notes")}
            sx={{ mb: 2, ...inputSurfaceSx }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18, borderTop: "1px solid #dce6f5", paddingTop: 14 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            color="inherit"
            sx={{
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 2.5,
              minWidth: 98,
              borderColor: "#afbed3",
              color: "#4a5f7d",
              background: "#eef3fb",
              px: 2,
              "&:hover": { background: "#e2ebf8", borderColor: "#91a8c6" },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            sx={{
              fontWeight: 800,
              fontSize: 14,
              borderRadius: 2.5,
              minWidth: 98,
              px: 2.5,
              background: "linear-gradient(135deg, #1976d2 0%, #1f8fff 100%)",
              boxShadow: "0 8px 18px rgba(31, 143, 255, 0.36)",
              "&:hover": {
                background: "linear-gradient(135deg, #1668b8 0%, #1976d2 100%)",
                boxShadow: "0 10px 22px rgba(25, 118, 210, 0.4)",
              },
            }}
            onClick={async () => {
              let image = undefined;
              if (sketchContainerRef.current) {
                const svgElem = sketchContainerRef.current.querySelector("svg");
                if (svgElem) {
                  const canvas = await html2canvas(svgElem as unknown as HTMLElement, {
                    backgroundColor: "#fff",
                    useCORS: true,
                    scale: 2,
                  });
                  image = canvas.toDataURL("image/png");
                }
              }

              const piece = {
                qty: Number(watch("qty") ?? 1),
                feet: String(feet ?? 0),
                inches: String(inchesRaw ?? ""),
                diameter: String(diameter),
                pipeType,
                pipeTag: watch("pipeTag") ?? "",
                fittingsEnd1: watch("fittingsEnd1") ?? "",
                fittingsEnd2: watch("fittingsEnd2") ?? "",
              } satisfies Piece;

              void image;
              if (onCreatePiece) onCreatePiece(piece);
            }}
          >
            Save
          </Button>
        </div>
      </form>
    </Box>
  );
}

export { PipeSpecForm };
