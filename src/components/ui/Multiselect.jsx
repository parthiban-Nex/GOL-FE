import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const autocompleteIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const autocompleteCheckedIcon = <CheckBoxIcon fontSize="small" />;
const SELECT_ALL_VALUE = "__select_all__";

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  withSelectAll,
  selectAllLabel,
  closeOnSelect = true,
  clearable = false,
  error,
  required,
  sx,
}) {
  const effectiveOptions = [...(options || [])];
  if (Array.isArray(value)) {
    value.forEach((val) => {
      if (
        val !== null &&
        val !== undefined &&
        val !== "" &&
        !effectiveOptions.some(
          (o) => String(o.value).toUpperCase() === String(val).toUpperCase(),
        )
      ) {
        effectiveOptions.push({ value: String(val), label: String(val) });
      }
    });
  }

  const selectedOptions = effectiveOptions.filter((o) =>
    (value || []).some(
      (v) => String(v).toUpperCase() === String(o.value).toUpperCase(),
    ),
  );
  const allSelected =
    withSelectAll &&
    effectiveOptions.length > 0 &&
    (value || []).length === effectiveOptions.length;

  const listOptions =
    withSelectAll && effectiveOptions.length > 0
      ? [
          {
            value: SELECT_ALL_VALUE,
            label: selectAllLabel ?? `All ${label ?? ""}`,
          },
          ...effectiveOptions,
        ]
      : effectiveOptions;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect={!closeOnSelect}
      disableClearable={!clearable}
      disabled={disabled}
      options={listOptions}
      value={selectedOptions}
      sx={sx}
      noOptionsText="No matches"
      isOptionEqualToValue={(o, v) => o.value === v.value}
      getOptionLabel={(o) => o.label}
      onChange={(_event, newValue, _reason, details) => {
        if (details?.option?.value === SELECT_ALL_VALUE) {
          onChange(allSelected ? [] : options.map((o) => o.value));
          return;
        }
        onChange(
          newValue
            .filter((o) => o.value !== SELECT_ALL_VALUE)
            .map((o) => o.value),
        );
      }}
      renderOption={(props, option, { selected }) => {
        const isSelectAllRow = option.value === SELECT_ALL_VALUE;
        const checked = isSelectAllRow ? allSelected : selected;
        return (
          <li {...props} key={option.value}>
            <Checkbox
              icon={autocompleteIcon}
              checkedIcon={autocompleteCheckedIcon}
              checked={checked}
              style={{ marginRight: 8 }}
            />
            {option.label}
          </li>
        );
      }}
      renderTags={(tagValue, getTagProps) =>
        allSelected
          ? [
              <Chip
                key="__all__"
                label={selectAllLabel ?? `All ${label ?? ""}`}
                size="small"
              />,
            ]
          : tagValue.map((option, index) => (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                {...getTagProps({ index })}
              />
            ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputLabelProps={{ required }} 
          placeholder={value.length ? "" : placeholder}
          aria-label={label}
          variant="standard"
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
            ...sx,
          }}
        />
      )}
      size="small"
      fullWidth
    />
  );
}
