import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/format";
import { cn } from "@/utils/cn";

export default function UserAvatar({ name = "", src, className }) {
  return (
    <Avatar className={cn(className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback>{getInitials(name) || "?"}</AvatarFallback>
    </Avatar>
  );
}
