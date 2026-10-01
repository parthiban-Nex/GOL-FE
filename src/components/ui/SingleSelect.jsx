import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

/**
 * Single-select counterpart to Multiselect — same Autocomplete look/feel,
 * but resolves to a single value instead of an array.
 */
export default function SingleSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  clearable = true,
  error,
  required,
  sx,
}) {
  const selectedOption = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      disabled={disabled}
      disableClearable={!clearable}
      sx={sx}
      noOptionsText="No matches"
      isOptionEqualToValue={(o, v) => o.value === v.value}
      getOptionLabel={(o) => o?.label ?? ""}
      onChange={(_event, newValue) => {
        onChange(newValue ? newValue.value : "");
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          variant="standard"
          placeholder={value ? "" : placeholder}
          aria-label={label}
          error={Boolean(error)}
          helperText={error}
          sx={{
            "& .MuiAutocomplete-inputRoot": {
              paddingBottom: "5px",
            },

            "& .MuiInput-underline:before": {
              borderBottomColor: "#ccc",
            },

            "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
              borderBottomColor: "#ccc",
            },

            "& .MuiInput-underline:after": {
              borderBottomColor: "#1976d2",
            },

            "& .MuiInputBase-input::placeholder": {
              color: "#999",
              opacity: 1,
            },

            "& .MuiInputLabel-root": {
              color: "#999",
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: "#1976d2",
            },

            "& .MuiFormLabel-asterisk": {
              color: "#ef4444",
            },
          }}
        />
      )}
      size="small"
      fullWidth
    />
  );
}
