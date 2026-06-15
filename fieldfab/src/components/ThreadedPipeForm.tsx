import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Piece, ThreadedFitting, ThreadedFittingType } from "../types";

type ThreadedPipeFormProps = {
  onCreatePiece?: (piece: Piece) => void | Promise<void | boolean>;
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

function totalLengthInches(feet: number | string, inches: string): number {
  return Number(feet || 0) * 12 + parseInches(inches || "0");
}

function fittingTypeFromLabel(label: string): ThreadedFittingType | null {
  const normalized = label.toLowerCase();
  if (!normalized.trim() || normalized === "none") return null;
  if (normalized.includes("reducing") && (normalized.includes("90") || normalized.includes("elbow"))) return "threadedreducingelbow90";
  if (normalized.includes("reducing") && normalized.includes("tee")) return "threadedreducingtee";
  if (normalized.includes("reducing") && normalized.includes("coupling")) return "threadedreducingcoupling";
  if (normalized.includes("90") || normalized.includes("elbow")) return "threadedelbow90";
  if (normalized.includes("bullhead") && normalized.includes("tee")) return "threadedbullheadtee";
  if (normalized.includes("tee")) return "threadedtee";
  if (normalized.includes("coupling")) return "threadedcoupling";
  if (normalized.includes("union")) return "threadedunion";
  if (normalized.includes("bushing")) return "threadedbushing";
  if (normalized.includes("cap")) return "threadedcap";
  if (normalized.includes("plug")) return "threadedplug";
  return null;
}

function directionFromLabel(label: string): "up" | "down" | "left" | "right" {
  const normalized = label.toLowerCase();
  if (normalized.includes("down")) return "down";
  if (normalized.includes("left")) return "left";
  if (normalized.includes("right")) return "right";
  return "up";
}

function isReducingFitting(label: string): boolean {
  return fittingTypeFromLabel(label)?.includes("reducing") ?? false;
}

function needsReducerSize(label: string): boolean {
  const type = fittingTypeFromLabel(label);
  return type === "threadedreducingcoupling" || type === "threadedbushing";
}

function needsReducingTeeSizes(label: string): boolean {
  return fittingTypeFromLabel(label) === "threadedreducingtee";
}

function fittingFromLabel(
  label: string,
  location: number,
  pipeSize: string,
  reducerToSize?: string,
  reducingTeeAcrossSize?: string,
  reducingTeeOutletSize?: string,
): ThreadedFitting | null {
  const type = fittingTypeFromLabel(label);
  if (!type) return null;

  const fitting: ThreadedFitting = {
    type,
    location,
    size: pipeSize,
  };

  if (type === "threadedreducingcoupling" || type === "threadedbushing") {
    fitting.runSize = pipeSize;
    fitting.outletSize = reducerToSize?.trim() || pipeSize;
    fitting.size = `${pipeSize} x ${fitting.outletSize}`;
  }

  if (type === "threadedreducingtee") {
    fitting.runSize = pipeSize;
    fitting.branchSize = reducingTeeAcrossSize?.trim() || pipeSize;
    fitting.outletSize = reducingTeeOutletSize?.trim() || pipeSize;
    fitting.size = `${pipeSize} x ${fitting.branchSize} x ${fitting.outletSize}`;
  }

  if (type.includes("elbow90") || type.includes("tee")) {
    fitting.direction = directionFromLabel(label);
  }

  return fitting;
}

const PIPE_SIZE_OPTIONS = [
  '4"',
  '3"',
  '2 1/2"',
  '2"',
  '1 1/2"',
  '1 1/4"',
  '1"',
  '3/4"',
  '1/2"',
];

const DIAMETER_OPTIONS = PIPE_SIZE_OPTIONS;

const MAKE_ON_FITTINGS = [
  'None',
  '90 Up',
  '90 Down',
  '90 Left',
  '90 Right',
  'Tee Run Up',
  'Tee Run Down',
  'Tee Run Left',
  'Tee Run Right',
  'Bullhead Tee',
  'Cap',
  'Coupling',
  'Reducing Coupling',
  'Union',
  'Bushing',
  'Reducing Tee Up',
  'Reducing Tee Down',
  'Reducing Tee Left',
  'Reducing Tee Right',
  'Plug',
];

const threadedPipeSchema = z.object({
  qty: z.coerce.number().min(1, "Quantity required"),
  feet: z.coerce.number().min(0, "Feet required"),
  inches: z.coerce.string().refine(
    (val) => {
      const parsed = parseInches(val);
      return !isNaN(parsed) && parsed >= 0 && parsed < 12;
    },
    { message: "Inches must be 0-11, decimal or fraction" }
  ),
  diameter: z.string().min(1, "Diameter required"),
  pipeTag: z.string().optional(),
  makeOnEnd1: z.string().optional(),
  makeOnEnd2: z.string().optional(),
  reducerToEnd1: z.string().optional(),
  reducerToEnd2: z.string().optional(),
  reducingTeeAcrossEnd1: z.string().optional(),
  reducingTeeAcrossEnd2: z.string().optional(),
  reducingTeeOutletEnd1: z.string().optional(),
  reducingTeeOutletEnd2: z.string().optional(),
}).superRefine((values, ctx) => {
  ([
    {
      fitting: values.makeOnEnd1,
      reducerTo: values.reducerToEnd1,
      teeAcross: values.reducingTeeAcrossEnd1,
      teeOutlet: values.reducingTeeOutletEnd1,
      pathPrefix: "End 1",
      reducerPath: "reducerToEnd1",
      teeAcrossPath: "reducingTeeAcrossEnd1",
      teeOutletPath: "reducingTeeOutletEnd1",
    },
    {
      fitting: values.makeOnEnd2,
      reducerTo: values.reducerToEnd2,
      teeAcross: values.reducingTeeAcrossEnd2,
      teeOutlet: values.reducingTeeOutletEnd2,
      pathPrefix: "End 2",
      reducerPath: "reducerToEnd2",
      teeAcrossPath: "reducingTeeAcrossEnd2",
      teeOutletPath: "reducingTeeOutletEnd2",
    },
  ] as const).forEach((end) => {
    if (needsReducerSize(end.fitting ?? "") && !end.reducerTo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${end.pathPrefix} reducing size required`,
        path: [end.reducerPath],
      });
    }

    if (needsReducingTeeSizes(end.fitting ?? "")) {
      if (!end.teeAcross?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${end.pathPrefix} across size required`,
          path: [end.teeAcrossPath],
        });
      }
      if (!end.teeOutlet?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${end.pathPrefix} outlet size required`,
          path: [end.teeOutletPath],
        });
      }
    }
  });
});

type ThreadedPipeFormValues = z.input<typeof threadedPipeSchema>;

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

function isNoneLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return !normalized || normalized === "none";
}

type SizeFieldName =
  | "reducerToEnd1"
  | "reducerToEnd2"
  | "reducingTeeAcrossEnd1"
  | "reducingTeeAcrossEnd2"
  | "reducingTeeOutletEnd1"
  | "reducingTeeOutletEnd2";

function ThreadedPipeForm({ onCreatePiece, onCancel, initialValues }: ThreadedPipeFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<ThreadedPipeFormValues>({
    resolver: zodResolver(threadedPipeSchema),
    mode: "onBlur",
    defaultValues: {
      qty: Number(initialValues?.qty ?? 1),
      feet: Number(initialValues?.feet ?? 10),
      inches: initialValues?.inches ?? "0",
      diameter: initialValues?.diameter ?? '1"',
      pipeTag: initialValues?.pipeTag ?? "",
      makeOnEnd1: initialValues?.fittingsEnd1 ?? "",
      makeOnEnd2: initialValues?.fittingsEnd2 ?? "",
      reducerToEnd1: "",
      reducerToEnd2: "",
      reducingTeeAcrossEnd1: "",
      reducingTeeAcrossEnd2: "",
      reducingTeeOutletEnd1: "",
      reducingTeeOutletEnd2: "",
    },
  });
  const diameter = watch("diameter");
  const makeOnEnd1 = watch("makeOnEnd1") ?? "";
  const makeOnEnd2 = watch("makeOnEnd2") ?? "";

  const renderSizeSelect = (name: SizeFieldName, label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={PIPE_SIZE_OPTIONS}
          value={field.value || ""}
          onChange={(_, newValue) => field.onChange(newValue ?? "")}
          onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!errors[name]}
              helperText={errors[name]?.message as string}
              sx={inputSurfaceSx}
            />
          )}
        />
      )}
    />
  );

  React.useEffect(() => {
    if (initialValues) {
      setValue("qty", Number(initialValues.qty ?? 1));
      setValue("feet", Number(initialValues.feet ?? 10));
      setValue("inches", initialValues.inches ?? "0");
      setValue("diameter", initialValues.diameter ?? '1"');
      setValue("pipeTag", initialValues.pipeTag ?? "");
      setValue("makeOnEnd1", initialValues.fittingsEnd1 ?? "");
      setValue("makeOnEnd2", initialValues.fittingsEnd2 ?? "");
      const end1Fitting = initialValues.threadedFittings?.find((fitting) => Number(fitting.location) === 0);
      const end2Fitting = initialValues.threadedFittings?.find((fitting) => Number(fitting.location) !== 0);
      setValue("reducerToEnd1", end1Fitting?.outletSize ?? "");
      setValue("reducerToEnd2", end2Fitting?.outletSize ?? "");
      setValue("reducingTeeAcrossEnd1", end1Fitting?.branchSize ?? "");
      setValue("reducingTeeAcrossEnd2", end2Fitting?.branchSize ?? "");
      setValue("reducingTeeOutletEnd1", end1Fitting?.outletSize ?? "");
      setValue("reducingTeeOutletEnd2", end2Fitting?.outletSize ?? "");
    }
  }, [initialValues, setValue]);

  const submitThreadedPipe = handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const end1 = values.makeOnEnd1 === "None" ? "" : values.makeOnEnd1 ?? "";
      const end2 = values.makeOnEnd2 === "None" ? "" : values.makeOnEnd2 ?? "";
      const totalInches = totalLengthInches(Number(values.feet ?? 0), String(values.inches ?? "0"));
      const threadedFittings = [
        fittingFromLabel(
          end1,
          0,
          String(values.diameter ?? ""),
          values.reducerToEnd1,
          values.reducingTeeAcrossEnd1,
          values.reducingTeeOutletEnd1,
        ),
        fittingFromLabel(
          end2,
          totalInches,
          String(values.diameter ?? ""),
          values.reducerToEnd2,
          values.reducingTeeAcrossEnd2,
          values.reducingTeeOutletEnd2,
        ),
      ].filter((fitting): fitting is ThreadedFitting => Boolean(fitting));
      const piece = {
        qty: Number(values.qty ?? 1),
        feet: String(values.feet ?? 0),
        inches: String(values.inches ?? "0"),
        diameter: String(values.diameter ?? ""),
        pipeType: "Threaded Pipe",
        pipeTag: values.pipeTag ?? "",
        fittingsEnd1: end1,
        fittingsEnd2: end2,
        outlets: [],
        threadedFittings,
      } satisfies Piece;

      await onCreatePiece?.(piece);
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Box maxWidth="100%" width="100%" mx="auto" sx={{ backgroundColor: "transparent", p: 0 }}>
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
          Threaded Pipe
        </div>
        <h2 style={{ fontWeight: 900, fontSize: "1.8rem", margin: "6px 0", color: "#1a2233", letterSpacing: 0 }}>
          Make-On Fittings
        </h2>
        <div style={{ fontWeight: 500, fontSize: "0.92rem", color: "#43556f", marginBottom: 8 }}>
          Enter threaded pipe lengths with fittings made on at either end.
        </div>
      </div>

      <form onSubmit={submitThreadedPipe}>
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
            label="Inches"
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
                  label="Pipe Diameter"
                  error={!!errors.diameter}
                  helperText={errors.diameter?.message as string}
                  placeholder={'Type or select e.g. 1", 2"'}
                  sx={{ mb: 2, ...inputSurfaceSx }}
                />
              )}
            />
          )}
        />

        <Controller
          name="makeOnEnd1"
          control={control}
          render={({ field }) => (
            <Autocomplete
              freeSolo
              options={MAKE_ON_FITTINGS}
              value={field.value || ""}
              onChange={(_, newValue) => field.onChange(newValue ?? "")}
              onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
              renderInput={(params) => (
                <TextField {...params} label="Make-On Fitting End 1" placeholder="Select fitting" sx={{ mb: 2, ...inputSurfaceSx }} />
              )}
            />
          )}
        />

        {!isNoneLabel(makeOnEnd1) && isReducingFitting(makeOnEnd1) && (
          needsReducingTeeSizes(makeOnEnd1) ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="End 1 Pipe Side" value={diameter || ""} disabled fullWidth sx={inputSurfaceSx} />
              {renderSizeSelect("reducingTeeAcrossEnd1", "End 1 Across Tee Size")}
              {renderSizeSelect("reducingTeeOutletEnd1", "End 1 Outlet Size")}
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="End 1 Pipe Side" value={diameter || ""} disabled fullWidth sx={inputSurfaceSx} />
              {renderSizeSelect("reducerToEnd1", "End 1 Reduces To")}
            </Stack>
          )
        )}

        <Controller
          name="makeOnEnd2"
          control={control}
          render={({ field }) => (
            <Autocomplete
              freeSolo
              options={MAKE_ON_FITTINGS}
              value={field.value || ""}
              onChange={(_, newValue) => field.onChange(newValue ?? "")}
              onInputChange={(_, newInputValue) => field.onChange(newInputValue)}
              renderInput={(params) => (
                <TextField {...params} label="Make-On Fitting End 2" placeholder="Select fitting" sx={{ mb: 2, ...inputSurfaceSx }} />
              )}
            />
          )}
        />

        {!isNoneLabel(makeOnEnd2) && isReducingFitting(makeOnEnd2) && (
          needsReducingTeeSizes(makeOnEnd2) ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="End 2 Pipe Side" value={diameter || ""} disabled fullWidth sx={inputSurfaceSx} />
              {renderSizeSelect("reducingTeeAcrossEnd2", "End 2 Across Tee Size")}
              {renderSizeSelect("reducingTeeOutletEnd2", "End 2 Outlet Size")}
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="End 2 Pipe Side" value={diameter || ""} disabled fullWidth sx={inputSurfaceSx} />
              {renderSizeSelect("reducerToEnd2", "End 2 Reduces To")}
            </Stack>
          )
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18, borderTop: "1px solid #dce6f5", paddingTop: 14 }}>
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
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
            type="submit"
            disabled={isSaving}
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
              opacity: isSaving ? 0.72 : 1,
              "&:hover": {
                background: "linear-gradient(135deg, #1668b8 0%, #1976d2 100%)",
                boxShadow: "0 10px 22px rgba(25, 118, 210, 0.4)",
              },
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Box>
  );
}

export { ThreadedPipeForm };
