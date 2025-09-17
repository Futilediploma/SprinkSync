

import { useState } from "react";
import PipeSketch from "./PipeSketch";
import WeldedOutletForm from "./WeldedOutletForm";
import type { WeldedOutlet } from "./WeldedOutletForm";
import { PIPE_TYPES, OUTLET_TYPES, FITTING_TYPES } from "../data/pipeOptions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  Stack,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
export default function PipeSpecForm() {
const parseInches = (val: string) => {
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
};

const parseFraction = (val: string) => {
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
};

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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showOutletForm, setShowOutletForm] = useState(false);
  const [outlets, setOutlets] = useState<WeldedOutlet[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(pipeSpecSchema),
    mode: "onBlur",
  });

  const feet = watch("feet") ?? 13;
  let inchesRaw = watch("inches");
  const inches = parseInches(String(inchesRaw ?? "0"));
  const length = Number(feet) * 12 + (isNaN(inches) ? 0 : inches);
  const pipeType = watch("pipeType") ?? "";
  const diameterRaw = watch("diameter");
  const diameter = typeof diameterRaw === "number" ? diameterRaw : parseFraction(String(diameterRaw ?? "0"));

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      setSuccess(true);
      reset();
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} width="100%" mx="auto" sx={{ backgroundColor: '#E79213FF' }}>
      <PipeSketch
        length={length}
        pipeType={pipeType}
        pipetag={watch("pipeTag") ?? ""}
        diameter={diameter}
        fittingsEndPipeLabel1={watch("fittingsEnd1") ?? ""}
        fittingsEndPipeLabel2={watch("fittingsEnd2") ?? ""}
        outlets={outlets}
      />
      <Button
        variant="outlined"
        color="primary"
        sx={{ mt: 2, mb: 1 }}
        onClick={() => setShowOutletForm(v => !v)}
      >
        {showOutletForm ? "Hide Welded Outlet Form" : "Add Welded Outlet"}
      </Button>
      {showOutletForm && (
        <WeldedOutletForm
          onAdd={outlet => {
            setOutlets(prev => [...prev, outlet]);
            setShowOutletForm(false);
          }}
          maxFeet={Number(feet)}
        />
      )}
      {outlets.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Welded Outlets:</Typography>
          {outlets.map((o, i) => {
            // Format location as ft/in/fraction
            const feet = Math.floor(o.location / 12);
            const rawInches = o.location % 12;
            let inches = Math.floor(rawInches);
            let fraction = "";
            const fracVal = +(rawInches - inches).toFixed(2);
            if (fracVal === 0.25) fraction = "1/4";
            else if (fracVal === 0.5) fraction = "1/2";
            else if (fracVal === 0.75) fraction = "3/4";
            return (
              <Box key={i} p={1} bgcolor="#fff8e1" borderRadius={2} mb={1}>
                Location: {feet}' {inches}{fraction ? ` ${fraction}` : ""}" &nbsp; Size: {o.size} &nbsp; Type: {o.type} &nbsp; Direction: {o.direction}
              </Box>
            );
          })}
        </Box>
      )}
      <Box component="form" mt={2} display="flex" flexDirection="column" gap={1} onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <Typography variant="h4" align="center" fontWeight={700} mb={2} color="primary.dark">
          Pipe Specification
        </Typography>
        <TextField
          label="Pipe Tag"
          type="text"
          fullWidth
          {...register("pipeTag")}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Feet"
            type="number"
            inputProps={{ min: 0 }}
            fullWidth
            {...register("feet", { valueAsNumber: true })}
            error={!!errors.feet}
            helperText={errors.feet?.message as string}
            variant="outlined"
          />
          <TextField
            label="Inches (decimals or fractions)"
            type="text"
            inputMode="decimal"
            fullWidth
            {...register("inches")}
            error={!!errors.inches}
            helperText={errors.inches?.message as string}
            variant="outlined"
          />
        </Stack>
        <TextField
          label="Diameter (inches)"
          type="text"
          fullWidth
          {...register("diameter", { 
            setValueAs: (value) => parseFraction(value)
          })}
          error={!!errors.diameter}
          helperText={errors.diameter?.message as string}
          variant="outlined"
          placeholder="e.g. 2 1/2, 3.5, 1/4"
        />
        <FormControl fullWidth error={!!errors.pipeType}>
          <InputLabel id="pipeType-label">Pipe Type</InputLabel>
          <Select
            labelId="pipeType-label"
            label="Pipe Type"
            defaultValue=""
            {...register("pipeType")}
          >
            <MenuItem value=""><em>Select type</em></MenuItem>
            {PIPE_TYPES.map((pt) => (
              <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.pipeType?.message as string}</FormHelperText>
        </FormControl>
        <FormControl fullWidth error={!!errors.outletType}>
          <InputLabel id="outletType-label">Default Outlet Type</InputLabel>
          <Select
            labelId="outletType-label"
            label="Outlet Type"
            defaultValue=""
            {...register("outletType")}
          >
            <MenuItem value=""><em>Select outlet</em></MenuItem>
            {OUTLET_TYPES.map((ot) => (
              <MenuItem key={ot.value} value={ot.value}>{ot.label}</MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.outletType?.message as string}</FormHelperText>
        </FormControl>
        <InputLabel id="fittings-end1-label">Pipe End 1</InputLabel>
        <Select
          labelId="fittings-end1-label"
          label="Pipe End/Fittings Type"
          defaultValue=""
          {...register("fittingsEnd1")}
        >
          <MenuItem value=""><em>Select fitting</em></MenuItem>
          {FITTING_TYPES.map((ft) => (
            <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>
          ))}
        </Select>
        <InputLabel id="fittings-end2-label">Pipe End 2</InputLabel>
        <Select
          labelId="fittings-end2-label"
          label="Pipe End/Fittings Type"
          defaultValue=""
          {...register("fittingsEnd2")}
        >
          <MenuItem value=""><em>Select fitting</em></MenuItem>
          {FITTING_TYPES.map((ft) => (
            <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>
          ))}
        </Select>
        
        <TextField
          label="Special Notes/Instructions"
          type="text"
          fullWidth
          multiline
          minRows={2}
          {...register("notes")}
          variant="outlined"
        />
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Form submitted successfully!</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={loading}
        >
          {loading ? "Submitting..." : "Generate & Send"}
        </Button>
      </Box>
      </Box>
  
    );
  }

