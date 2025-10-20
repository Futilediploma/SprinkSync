import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { PIPE_TYPES, OUTLET_TYPES, FITTING_TYPES } from "../data/pipeOptions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";

type PipeSpecFormProps = {
  onCreatePiece?: (piece: any) => void;
  onCancel?: () => void;
  initialValues?: any;
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

function parseFraction(val: string) {
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

const pipeSpecSchema = z.object({
  feet: z.coerce.number().min(0, "Feet required"),
  inches: z.coerce.string().refine(
    (val) => {
      const parsed = parseInches(val);
      return !isNaN(parsed) && parsed >= 0 && parsed < 12;
    },
    { message: "Inches must be 0-11, decimal or fraction (e.g. 3.5 or 1/2)" }
  ),
  diameter: z.coerce.number().min(1, "Diameter required"),
  pipeType: z.string().min(1, "Select a pipe type"),
  outletType: z.string().min(1, "Select an outlet type"),
  fittingsEnd1: z.string().optional(),
  fittingsEnd2: z.string().optional(),
  notes: z.string().optional(),
  pipeTag: z.string().optional(),
});

function PipeSpecForm({ onCreatePiece, onCancel, initialValues }: PipeSpecFormProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(pipeSpecSchema),
    mode: "onBlur",
    defaultValues: initialValues || {},
  });

  // If initialValues change (editing a different piece), update form values
  // (This is a rare case, but ensures correct behavior)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [initialValues, setValue]);
  const feet = watch("feet") ?? 1; // default to 1 foot
  let inchesRaw = watch("inches");
  const pipeType = watch("pipeType") ?? "schedule_40";
  const diameterRaw = watch("diameter");
  const diameter = Math.max(typeof diameterRaw === "number" ? diameterRaw : parseFraction(String(diameterRaw ?? "0")), 1); // at least 1 inch
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  return (
    <Box maxWidth="100%" width="100%" mx="auto" sx={{ backgroundColor: '#fff', p: 1, borderRadius: 3, boxShadow: 'none' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '8px 0', color: '#1a2233', letterSpacing: 1 }}>Pipe Specification</h2>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#222', marginBottom: 8 }}>Please Fill Out Form.</div>
      </div>
      <form onSubmit={e => { e.preventDefault(); }}>
        <div style={{ marginBottom: 12 }}>
          <TextField label="Pipe Tag" type="text" fullWidth {...register("pipeTag")} InputProps={{ style: { background: '#fdf5e6', borderRadius: 8 } }} sx={{ mb: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Feet" type="number" inputProps={{ min: 0 }} fullWidth {...register("feet", { valueAsNumber: true })} error={!!errors.feet} helperText={errors.feet?.message as string} InputProps={{ style: { background: '#fdf5e6', borderRadius: 8 } }} />
            <TextField label="Inches (decimals or fractions)" type="text" inputMode="decimal" fullWidth {...register("inches")} error={!!errors.inches} helperText={errors.inches?.message as string} InputProps={{ style: { background: '#fdf5e6', borderRadius: 8 } }} />
          </Stack>
          <TextField label="Diameter (inches)" type="text" fullWidth {...register("diameter", { setValueAs: (value) => parseFraction(value) })} error={!!errors.diameter} helperText={errors.diameter?.message as string} placeholder="e.g. 2 1/2, 3.5, 1/4" sx={{ mb: 2 }} InputProps={{ style: { background: '#fdf5e6', borderRadius: 8 } }} />
          <FormControl fullWidth error={!!errors.pipeType} sx={{ mb: 2 }}>
            <InputLabel id="pipeType-label">Pipe Type</InputLabel>
            <Select labelId="pipeType-label" label="Pipe Type" defaultValue="" {...register("pipeType")}
              sx={{ background: '#fdf5e6', borderRadius: 2 }}>
              <MenuItem value=""><em>Select type</em></MenuItem> {PIPE_TYPES.map((pt) => (<MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>))}
            </Select>
            <FormHelperText>{errors.pipeType?.message as string}</FormHelperText>
          </FormControl>
          <FormControl fullWidth error={!!errors.outletType} sx={{ mb: 2 }}>
            <InputLabel id="outletType-label">Default Outlet Type</InputLabel>
            <Select labelId="outletType-label" label="Outlet Type" defaultValue="" {...register("outletType")}
              sx={{ background: '#fdf5e6', borderRadius: 2 }}>
              <MenuItem value=""><em>Select outlet</em></MenuItem> {OUTLET_TYPES.map((ot) => (<MenuItem key={ot.value} value={ot.value}>{ot.label}</MenuItem>))}
            </Select>
            <FormHelperText>{errors.outletType?.message as string}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="fittings-end1-label">Pipe End 1</InputLabel>
            <Select labelId="fittings-end1-label" label="Pipe End/Fittings Type" defaultValue="" {...register("fittingsEnd1")}
              sx={{ background: '#fdf5e6', borderRadius: 2 }} >
              <MenuItem value=""><em>Select fitting</em></MenuItem>
              {FITTING_TYPES.map((ft) => (<MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="fittings-end2-label">Pipe End 2</InputLabel>
            <Select labelId="fittings-end2-label" label="Pipe End/Fittings Type" defaultValue="" {...register("fittingsEnd2")}
              sx={{ background: '#fdf5e6', borderRadius: 2 }} >
              <MenuItem value=""><em>Select fitting</em></MenuItem>
              {FITTING_TYPES.map((ft) => (<MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField label="Special Notes/Instructions" type="text" fullWidth multiline minRows={2} {...register("notes")} sx={{ mb: 2 }} InputProps={{ style: { background: '#fdf5e6', borderRadius: 8 } }} />
        </div>
        {/* Finish/Cancel buttons at the bottom */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            color="inherit"
            sx={{ fontWeight: 600, fontSize: 15, borderRadius: 2, minWidth: 90, background: '#f5f5f5', color: '#888' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontWeight: 600, fontSize: 15, borderRadius: 2, minWidth: 90 }}
            onClick={async () => {
              let image = undefined;
              if (sketchContainerRef.current) {
                const svgElem = sketchContainerRef.current.querySelector('svg');
                if (svgElem) {
                  const canvas = await html2canvas(svgElem as unknown as HTMLElement, {
                    backgroundColor: '#fff',
                    useCORS: true,
                    scale: 2,
                  });
                  image = canvas.toDataURL('image/png');
                }
              }
              const piece = {
                feet,
                inches: inchesRaw,
                diameter,
                pipeType,
                outletType: watch("outletType"),
                fittingsEnd1: watch("fittingsEnd1"),
                fittingsEnd2: watch("fittingsEnd2"),
                notes: watch("notes"),
                pipeTag: watch("pipeTag"),
                image,
              };
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
