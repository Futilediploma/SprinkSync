import React, { useState } from "react";
import { OUTLET_TYPES } from "../data/pipeOptions";
import { Box, Button, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";


export interface WeldedOutlet {
  location: number; // inches from pipe start
  size: string;
  type: string;
  direction: string;
}

interface WeldedOutletFormProps {
  onAdd: (outlet: WeldedOutlet) => void;
  maxFeet?: number;
}


const WeldedOutletForm: React.FC<WeldedOutletFormProps> = ({ onAdd, maxFeet = 100 }) => {
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(0);
  const [fraction, setFraction] = useState("");
  const [size, setSize] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");

  function formatInches(val: number, frac: string) {
    let result = String(val);
    if (frac) result += ` ${frac}`;
    if (val === 0 && frac) result = frac;
    return result;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let totalInches = inches;
    if (fraction) {
      const [num, denom] = fraction.split("/").map(Number);
      if (denom) totalInches += num / denom;
    }
    const location = feet * 12 + totalInches;
    onAdd({ location, size, type, direction });
    setFeet(0);
    setInches(0);
    setFraction("");
    setSize("");
    setType("");
    setDirection("");
  };


  return (
    <Box component="form" onSubmit={handleSubmit} p={2} borderRadius={2} bgcolor="#f5f5f5" mb={2}>
      <Typography variant="h6" mb={2}>Add Welded Outlet</Typography>
      <Typography variant="body2" mb={1} color="text.secondary">
  Location: {feet}' {formatInches(inches, fraction)}"
      </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 70 }, flexGrow: 1 }} required>
            <InputLabel id="location-feet-label">Location (ft)</InputLabel>
            <Select
              labelId="location-feet-label"
              label="Location (ft)"
              value={String(feet)}
              onChange={e => setFeet(Number(e.target.value))}
              MenuProps={{ disablePortal: true }}
            >
              {[...Array(maxFeet + 1).keys()].map(f => (
                <MenuItem key={f} value={String(f)}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 70 }, flexGrow: 1 }} required>
            <InputLabel id="location-inches-label">Location (in)</InputLabel>
            <Select
              labelId="location-inches-label"
              label="Location (in)"
              value={String(inches)}
              onChange={e => setInches(parseInt(e.target.value))}
              MenuProps={{ disablePortal: true }}
            >
              {[...Array(12).keys()].map(i => (
                <MenuItem key={i} value={String(i)}>{i}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 70 }, flexGrow: 1 }} required>
            <InputLabel id="location-fraction-label">Fraction</InputLabel>
            <Select
              labelId="location-fraction-label"
              label="Fraction"
              value={fraction}
              onChange={e => setFraction(e.target.value)}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value="">-</MenuItem>
              <MenuItem value="0">0</MenuItem>
              <MenuItem value="1/8">1/8</MenuItem>
              <MenuItem value="1/4">1/4</MenuItem>
              <MenuItem value="3/8">3/8</MenuItem>
              <MenuItem value="1/2">1/2</MenuItem>
              <MenuItem value="5/8">5/8</MenuItem>  
              <MenuItem value="3/4">3/4</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 70 }, flexGrow: 1 }} required>
            <InputLabel id="outlet-size-label">Outlet Size</InputLabel>
            <Select
              labelId="outlet-size-label"
                label="Outlet Size"
                value={size}
                onChange={e => setSize(e.target.value)}
                MenuProps={{ disablePortal: true }}
                >
                <MenuItem value="1">1"</MenuItem>
                <MenuItem value="1.25">1 1/4"</MenuItem>
                <MenuItem value="1.5">1 1/2"</MenuItem>
                <MenuItem value="2">2"</MenuItem>
                <MenuItem value="2.5">2 1/2"</MenuItem>
                <MenuItem value="3">3"</MenuItem>
                <MenuItem value="4">4"</MenuItem>
                <MenuItem value="5">5"</MenuItem>
                <MenuItem value="6">6"</MenuItem>
                <MenuItem value="8">8"</MenuItem>
                <MenuItem value="10">10"</MenuItem>
                <MenuItem value="12">12"</MenuItem>
            </Select>
          </FormControl>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
          <InputLabel id="outletType-label">Outlet Type</InputLabel>
          <Select
            labelId="outletType-label"
            label="Outlet Type"
            value={type}
            onChange={e => setType(e.target.value as string)}
            required
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value=""><em>Select outlet</em></MenuItem>
            {OUTLET_TYPES.map((ot) => (
              <MenuItem key={ot.value} value={ot.value}>{ot.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
          <InputLabel id="direction-label">Direction</InputLabel>
          <Select
            labelId="direction-label"
            label="Direction"
            value={direction}
            onChange={e => setDirection(e.target.value as string)}
            required
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value=""><em>Select direction</em></MenuItem>
            {[1,2,3,4,5,6,7,8].map((d) => (
              <MenuItem key={d} value={String(d)}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
  <Button
    type="submit"
    variant="contained"
    color="primary"
    disabled={feet > maxFeet || !size || !type || !direction}
  >
    Add Outlet
  </Button>
    </Box>
  );
};

export default WeldedOutletForm;
