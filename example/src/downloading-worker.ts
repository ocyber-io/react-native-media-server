export class DownloadingWorker {
  private terminated: boolean = false;
  get open() {
    return !this.terminated;
  }
  worker: (parent: DownloadingWorker) => Promise<void>;

  start() {
    if (!this.terminated && this.worker) {
      this.worker(this);
    }
  }

  terminate() {
    this.terminated = true;
  }
}
