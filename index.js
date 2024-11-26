/**
 * author Omendra Shekhawat
 * created on 26-11-2024-19h-57m
 * github: https://github.com/omendra9991
 * copyright 2024
 */

const express = require('express')
const fs = require('fs').promises

const app = express()
const port = 3000
/* Function to filter log files under date range */
const filterFilesByDateRange = (file, startDate, endDate) => {
  if (!startDate || !endDate) {
    return true
  }
  const match = file.match(/^(\d{4})(\d{2})(\d{2})/)
  if (match) {
    const [_, year, month, day] = match
    const fileDate = new Date(`${year}-${month}-${day}`).getTime() // Convert to timestamp
    return fileDate >= Number(startDate) && fileDate <= Number(endDate) // Check if within range
  }
  return false // Skip files that don't match the pattern
}
/* Functin to process the log files and filter out specific logs of Disconnect */
async function processLogs(logDirectory, startDate, endDate) {
  try {
    const files = await fs.readdir(logDirectory)
    const entry = {}
    for (const file of files) {
      /* Check if file is valid log file and in date range */
      if (
        file.endsWith('.log') &&
        filterFilesByDateRange(file, startDate, endDate)
      ) {
        const filePath = `${logDirectory}/${file}`
        const fileData = await fs.readFile(filePath, 'utf-8')

        const lines = fileData.split('\n')
        for (const line of lines) {
          /* Extract relevant data using regular expressions or string manipulation */ 
          const computerNameMatch = line.match(/ComputerName:([^\s]+)/)

          if (computerNameMatch) {
            const computerName = computerNameMatch[1].trim()

            if (line.includes('Client is disconnected')) {
              const regex = /\((\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\)/
              /* Check if Date is present in log */
              const dateMatch = line.match(regex)
              if (dateMatch) {
                const dateTimeString = dateMatch[1]

                const currentYear = file.substring(0, 4)
                const timestamp = new Date( `${currentYear}/${dateTimeString}`).getTime() //  Convert to timestamp

                if (!startDate || !endDate ||  (startDate <= timestamp && endDate >= timestamp)) {
                  if (entry[computerName]) {
                    entry[computerName]++
                  } else {
                    entry[computerName] = 1
                  }
                }
              }
            }
          }
        }
      }
    }
    return entry
  } catch (error) {
    console.error('Error processing logs:', error)
    throw error
  }
}

/* Api Routes */
app.get('/disconnects', async (req, res) => {
  const startDate = req.query.startDate
  const endDate = req.query.endDate

  try {
    const sortedData = await processLogs('./logs', startDate, endDate)
    res.json(sortedData)
  } catch (error) {
    console.error('Error processing logs:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
