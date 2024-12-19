export function getAudioDuration(filePath: string, ffmpeg): Promise<number> {
  console.log("utils.ts->2", ffmpeg);
  return new Promise((resolve, reject) => {
      console.log("utils.ts->2", ffmpeg);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

export function timeToSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}