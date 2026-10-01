import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CustomerSearchBar({
  value,
  onChange,
  onSearch,
  isSearching,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onSearch();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search Mobile No or Vehicle Reg No"
          icon={Search}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        isLoading={isSearching}
        className="sm:w-32 "
      >
        Search
      </Button>
    </form>
  );
}
