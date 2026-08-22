(() => {
  try {
    const theme = localStorage.getItem('matrix-theme') || 'system'
    const density = localStorage.getItem('matrix-density') || 'comfortable'
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
  } catch {
    document.documentElement.dataset.theme = 'system'
    document.documentElement.dataset.density = 'comfortable'
  }
})()
