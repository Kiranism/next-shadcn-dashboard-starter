import { IndexSelector } from "@/components/select/index-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bird, Rabbit, Turtle } from "lucide-react";

export function SearchSettings() {
  return (
    //   <Drawer>
    //     <DrawerTrigger asChild>
    //       <Button variant="ghost" size="icon" className="md:hidden">
    //         <Settings className="size-4" />
    //         <span className="sr-only">Settings</span>
    //       </Button>
    //     </DrawerTrigger>
    //     <DrawerContent className="max-h-[80vh]">
    //       <DrawerHeader>
    //         <DrawerTitle>Configuration</DrawerTitle>
    //         <DrawerDescription>
    //           Configure the settings for the model and messages.
    //         </DrawerDescription>
    //       </DrawerHeader>
    //       <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
    //         <fieldset className="grid gap-6 rounded-lg border p-4">
    //           <legend className="-ml-1 px-1 text-sm font-medium">
    //             Settings
    //           </legend>
    //           <div className="grid gap-3">
    //             <Label htmlFor="model">Model</Label>
    //             <Select>
    //               <SelectTrigger
    //                 id="model"
    //                 className="items-start [&_[data-description]]:hidden"
    //               >
    //                 <SelectValue placeholder="Select a model" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 <SelectItem value="genesis">
    //                   <div className="flex items-start gap-3 text-muted-foreground">
    //                     <Rabbit className="size-5" />
    //                     <div className="grid gap-0.5">
    //                       <p>
    //                         Neural{" "}
    //                         <span className="font-medium text-foreground">
    //                           Genesis
    //                         </span>
    //                       </p>
    //                       <p className="text-xs" data-description>
    //                         Our fastest model for general use cases.
    //                       </p>
    //                     </div>
    //                   </div>
    //                 </SelectItem>
    //                 <SelectItem value="explorer">
    //                   <div className="flex items-start gap-3 text-muted-foreground">
    //                     <Bird className="size-5" />
    //                     <div className="grid gap-0.5">
    //                       <p>
    //                         Neural{" "}
    //                         <span className="font-medium text-foreground">
    //                           Explorer
    //                         </span>
    //                       </p>
    //                       <p className="text-xs" data-description>
    //                         Performance and speed for efficiency.
    //                       </p>
    //                     </div>
    //                   </div>
    //                 </SelectItem>
    //                 <SelectItem value="quantum">
    //                   <div className="flex items-start gap-3 text-muted-foreground">
    //                     <Turtle className="size-5" />
    //                     <div className="grid gap-0.5">
    //                       <p>
    //                         Neural{" "}
    //                         <span className="font-medium text-foreground">
    //                           Quantum
    //                         </span>
    //                       </p>
    //                       <p className="text-xs" data-description>
    //                         The most powerful model for complex
    //                         computations.
    //                       </p>
    //                     </div>
    //                   </div>
    //                 </SelectItem>
    //               </SelectContent>
    //             </Select>
    //           </div>
    //           <div className="grid gap-3">
    //             <Label htmlFor="temperature">Temperature</Label>
    //             <Input id="temperature" type="number" placeholder="0.4" />
    //           </div>
    //           <div className="grid gap-3">
    //             <Label htmlFor="top-p">Top P</Label>
    //             <Input id="top-p" type="number" placeholder="0.7" />
    //           </div>
    //           <div className="grid gap-3">
    //             <Label htmlFor="top-k">Top K</Label>
    //             <Input id="top-k" type="number" placeholder="0.0" />
    //           </div>
    //         </fieldset>
    //         <fieldset className="grid gap-6 rounded-lg border p-4">
    //           <legend className="-ml-1 px-1 text-sm font-medium">
    //             Messages
    //           </legend>
    //           <div className="grid gap-3">
    //             <Label htmlFor="role">Role</Label>
    //             <Select defaultValue="system">
    //               <SelectTrigger>
    //                 <SelectValue placeholder="Select a role" />
    //               </SelectTrigger>
    //               <SelectContent>
    //                 <SelectItem value="system">System</SelectItem>
    //                 <SelectItem value="user">User</SelectItem>
    //                 <SelectItem value="assistant">Assistant</SelectItem>
    //               </SelectContent>
    //             </Select>
    //           </div>
    //           <div className="grid gap-3">
    //             <Label htmlFor="content">Content</Label>
    //             <Textarea id="content" placeholder="You are a..." />
    //           </div>
    //         </fieldset>
    //       </form>
    //     </DrawerContent>
    //   </Drawer>
    //   <Button
    //     variant="outline"
    //     size="sm"
    //     className="ml-auto gap-1.5 text-sm"
    //   >
    //     <Share className="size-3.5" />
    //     Share
    //   </Button>
    // <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
    <div
      className="relative flex-col  gap-8 flex"
      x-chunk="dashboard-03-chunk-0"
    >
      <form className="grid w-full items-start gap-6">
        <fieldset className="grid gap-6 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">Search</legend>
          <div className="grid gap-3">
            <Label htmlFor="model">Type</Label>
            <Select>
              <SelectTrigger
                id="mode"
                className="items-start [&_[data-description]]:hidden"
              >
                <SelectValue placeholder="Select a mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Rabbit className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Keyword{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Keyword search using BM25.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="explorer">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Bird className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Dense{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Use vectors embeddings to perform semantic search.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="quantum">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Turtle className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Hybrid{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Combine both keyword and vector embeddings search.
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="model">Embedding Model</Label>
            <Select>
              <SelectTrigger
                id="model"
                disabled
                className="items-start [&_[data-description]]:hidden"
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="genesis">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Rabbit className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        Neural{" "}
                        <span className="font-medium text-foreground">
                          Genesis
                        </span>
                      </p>
                      <p className="text-xs" data-description>
                        Our fastest model for general use cases.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="explorer">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Bird className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        Neural{" "}
                        <span className="font-medium text-foreground">
                          Explorer
                        </span>
                      </p>
                      <p className="text-xs" data-description>
                        Performance and speed for efficiency.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="quantum">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Turtle className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        Neural{" "}
                        <span className="font-medium text-foreground">
                          Quantum
                        </span>
                      </p>
                      <p className="text-xs" data-description>
                        The most powerful model for complex computations.
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="index">Index</Label>
            <IndexSelector />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="top-k">TopK</Label>
              <Input id="top-k" type="number" placeholder="3" />
            </div>
          </div>
        </fieldset>
      </form>
      <form className="grid w-full items-start gap-6">
        <fieldset className="grid gap-6 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">Chat</legend>
          <div className="flex flex-row justify-end ">
            <div className="absolute">
              <Switch id="airplane-mode" />
            </div>
          </div>
          <div className="grid gap-3 opacity-50">
            <Label htmlFor="model">Type</Label>
            <Select>
              <SelectTrigger
                id="mode"
                className="items-start [&_[data-description]]:hidden"
                disabled
              >
                <SelectValue placeholder="Select a mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Rabbit className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Keyword{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Keyword search using BM25.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="explorer">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Bird className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Dense{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Use vectors embeddings to perform semantic search.
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="quantum">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Turtle className="size-5" />
                    <div className="grid gap-0.5">
                      <p>
                        <span className="font-medium text-foreground">
                          Hybrid{" "}
                        </span>
                        Search
                      </p>
                      <p className="text-xs" data-description>
                        Combine both keyword and vector embeddings search.
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
