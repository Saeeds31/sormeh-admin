import { toast } from "vue3-toastify";
export function displayError(err) {
  let messages = [];
  for (const key in err) {
    err[key].forEach((error) => messages.push(error));
  }
  messages.forEach((message) => toast.error(message));
}
