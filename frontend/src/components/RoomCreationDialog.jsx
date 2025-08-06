              <Select
                value={selectedSubject || ''}
                onChange={handleSubjectChange}
                displayEmpty
                fullWidth
              >
                <MenuItem value="">
                  <em>주제 선택</em>
                </MenuItem>
                {subjects.map((subject) => (
                  <MenuItem value={subject.id} key={`subject-${subject.id}`}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
