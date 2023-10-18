using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;
using System.Diagnostics;

namespace CommandBuilder {
	public partial class FPrincipal: Form {
		private static int contadorRespuestas;

		private readonly List<CommandOption> options;
		private readonly List<AliasField> aliasFields;
		private readonly List<ResponseField> responseFields;

		public FPrincipal() {
			this.InitializeComponent();
			this.options = new List<CommandOption>();
			this.aliasFields = new List<AliasField>();
			this.responseFields = new List<ResponseField>();

			this.sflComando.InitialDirectory = Environment.CurrentDirectory;
		}

		private void BtnGenerar_Click(object sender, EventArgs e) {
			this.sflComando.FileName = this.tbNombre.InputText;

			if(this.sflComando.ShowDialog() != DialogResult.OK)
				return;

			MessageBoxButtons botonesError = MessageBoxButtons.AbortRetryIgnore;
			MessageBoxButtons botonesReporte = MessageBoxButtons.OK;
			MessageBoxIcon íconoCuidado = MessageBoxIcon.Warning;
			MessageBoxIcon íconoError = MessageBoxIcon.Error;
			DialogResult resultado = DialogResult.None;

			if(File.Exists(this.sflComando.FileName)) {
				MessageBox.Show(
					"Sobreescribir comandos está prohibido.\nRenombra el comando o borra el archivo existente para continuar",
					"El archivo ya existe",
					botonesReporte,
					MessageBoxIcon.Information
				);
				this.tbNombre.Focus();
				return;
			}

			do {
				FileStream fileStream = null;
				StreamWriter streamWriter = null;
				try {
					CommandBuilder commandBuilder = new CommandBuilder();

					CommandManager commandManager = new CommandManager(
						this.tbNombre.InputText,
						this.aliasFields.Select(af => af.tbAlias.InputText).ToList(),
						this.tbDescripciónLarga.InputText,
						this.tbDescripciónBreve.InputText);

					foreach(ResponseField responseField in this.responseFields)
						commandManager.AgregarRespuesta(new CommandResponse(
							responseField.tbNombre.InputText,
							responseField.Type,
							responseField.tbParámetros.InputText.Split(' ')));

					commandBuilder.AgregarComponente(commandManager);

					CommandTagsManager commandTagsManager = new CommandTagsManager();
					foreach(CommandTagsManager.CommandTag etiqueta in this.VerEtiquetas())
						commandTagsManager.AgregarEtiqueta(etiqueta);
					commandBuilder.AgregarComponente(commandTagsManager);

					if(this.options.Count > 0) {
						CommandOptionsManager commandOptionsManager = new CommandOptionsManager();
						commandBuilder.AgregarComponente(commandOptionsManager);

						foreach(CommandOption option in this.options)
							commandOptionsManager.AgregarOpción(option);
					}

					string código = commandBuilder.ImprimirTodo();
					if(new FCommandPreview(código).ShowDialog() == DialogResult.OK) {
						fileStream = new FileStream(this.sflComando.FileName, FileMode.CreateNew, FileAccess.Write);
						streamWriter = new StreamWriter(fileStream);
						streamWriter.Write(código);

						Process process = new Process();
						process.StartInfo.FileName = "notepad.exe";
						process.StartInfo.Arguments = this.sflComando.FileName;
						process.Start();
					}

					resultado = DialogResult.OK;
				} catch(ArgumentNullException ex) {
					resultado = MessageBox.Show(ex.Message, "Parámetro incompleto", botonesReporte, íconoCuidado);
				} catch(FormatException ex) {
					resultado = MessageBox.Show(ex.Message, "Formato inválido", botonesReporte, íconoCuidado);
				} catch(ArgumentException ex) {
					resultado = MessageBox.Show(ex.Message, "Parámetro inválido", botonesReporte, íconoCuidado);
				} catch(InvalidOperationException ex) {
					resultado = MessageBox.Show(ex.Message, "Operación inválida", botonesReporte, íconoCuidado);
				} catch(IOException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de flujo de archivo", botonesError, íconoError);
				} catch(UnauthorizedAccessException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de acceso a archivo", botonesError, íconoError);
				} catch(Exception ex) {
					resultado = MessageBox.Show(
						$"Ocurrió un error inesperado.\n" +
						$"Puede deberse a un problema con la aplicación.\n\n" +
						$"Detalles:\n{ex.Message}",
						"Error inesperado",
						botonesError,
						íconoError);

					if(resultado == DialogResult.Abort)
						throw ex;
				} finally {
					if(streamWriter != null)
						streamWriter.Close();
					if(fileStream != null)
						fileStream.Dispose();
				}
			} while(resultado == DialogResult.Retry);
		}

		private void BtnNuevoAlias_Click(object sender, EventArgs e) {
			if(this.tbNuevoAlias.Empty)
				return;

			foreach(AliasField af in this.aliasFields)
				if(af.tbAlias.InputText == this.tbNuevoAlias.InputText)
					return;

			this.pnlAlias.Height += 45;
			AliasField aliasField = new AliasField(this);
			Panel panel = aliasField.pnlAliasField;

			aliasField.tbAlias.InputText = this.tbNuevoAlias.InputText;
			panel.TabIndex = this.pnlAlias.TabIndex;

			this.aliasFields.Add(aliasField);
			this.pnlAlias.Controls.Add(panel);
			panel.BringToFront();
			this.pnlAlias.Update();

			this.tbNuevoAlias.Clear();
			this.tbNuevoAlias.Focus();
		}

		internal void RemoverAlias(AliasField aliasField) {
			Panel panel = aliasField.pnlAliasField;
			this.pnlAlias.Controls.Remove(panel);
			this.aliasFields.Remove(aliasField);
			aliasField.Dispose();
			this.pnlAlias.Height -= 45;
		}

		private void BtnAgregarParámetro_Click(object sender, EventArgs e) {
			FParam fParam = new FParam(false);

			try {
				if(fParam.ShowDialog() != DialogResult.OK)
					return;

				this.options.Add(fParam.GenerarParámetro());
			} catch(FormatException ex) {
				MessageBox.Show(ex.Message, "Formato inválido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
			} finally {
				fParam.Dispose();
			}

			this.ActualizarListaOpciones();
		}

		private void BtnAgregarBandera_Click(object sender, EventArgs e) {
			FFlag fFlag = new FFlag(false);

			try {
				if(fFlag.ShowDialog() != DialogResult.OK)
					return;

				this.options.Add(fFlag.GenerarBandera());
			} catch(ArgumentException ex) {
				MessageBox.Show(ex.Message, "Datos inválidos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
			} catch(FormatException ex) {
				MessageBox.Show(ex.Message, "Formato inválido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
			} finally {
				fFlag.Dispose();
			}

			this.ActualizarListaOpciones();
		}

		private void DgvOpciones_CellContentDoubleClick(object sender, DataGridViewCellEventArgs e) {
			int id = e.RowIndex;
			CommandOption option = this.options[id];

			DialogResult resultado;
			if(option is CommandParam) {
				CommandParam param = option as CommandParam;

				FParam fParam = new FParam(true);
				fParam.tbName.InputText = option.Identifier;
				fParam.tbDesc.InputText = option.Desc;
				fParam.cmbTipos.SelectedIndex = (int)param.Type;
				fParam.cmbPoly.SelectedIndex = (int)param.Poly.Rank;
				fParam.tbPolyMax.InputText = param.Poly.Max.ToString();
				fParam.tbPolyParams.InputText = param.Poly.VerPolyParams(" ");
				resultado = fParam.ShowDialog();

				if(resultado == DialogResult.Abort) {
					this.options.RemoveAt(id);
					this.ActualizarListaOpciones();
					return;
				}

				if(resultado != DialogResult.OK)
					return;

				this.options[id] = fParam.GenerarParámetro();
			} else {
				CommandFlag flag = option as CommandFlag;
				char[] shortIds = flag.ShortIds;
				string[] longIds = flag.LongIds;

				FFlag fFlag = new FFlag(true);
				fFlag.tbCortos.InputText = new string(shortIds);
				fFlag.tbLargos.InputText = string.Join(" ", longIds) ?? "";
				fFlag.tbDesc.InputText = option.Desc;

				if(option is CommandFlagExpressive) {
					CommandFlagExpressive exprFlag = option as CommandFlagExpressive;
					fFlag.tbNombre.InputText = exprFlag.ExprName;
					fFlag.cmbTipos.SelectedIndex = (int)exprFlag.ExprType;

					fFlag.rbExpresiva.Checked = true;
				} else
					fFlag.rbSimple.Checked = true;

				resultado = fFlag.ShowDialog();

				if(resultado == DialogResult.Abort) {
					this.options.RemoveAt(id);
					this.ActualizarListaOpciones();
					return;
				}

				if(resultado != DialogResult.OK)
					return;

				this.options[id] = fFlag.GenerarBandera();
			}

			this.ActualizarListaOpciones();
		}

		private void ActualizarListaOpciones() {
			this.dgvOpciones.Rows.Clear();
			this.options.Sort();
			foreach(CommandOption option in this.options)
				this.dgvOpciones.Rows.Add(
					option.OptionKind,
					option.Identifier,
					option.Desc
				);
		}

		private void btnAgregarRespuesta_Click(object sender, EventArgs e) {
			if(!(sender is Button))
				return;

			Button botón = sender as Button;
			CommandResponse.InteractionType tipo = (CommandResponse.InteractionType)botón.TabIndex;

			this.pnlListaRespuestas.Height += 179;
			ResponseField responseField = new ResponseField(this, tipo);
			Panel panel = responseField.pnlResponseField;

			responseField.tbNombre.InputText = $"respuesta{++contadorRespuestas}";
			panel.TabIndex = this.pnlListaRespuestas.TabIndex;

			this.responseFields.Add(responseField);
			this.pnlListaRespuestas.Controls.Add(panel);
			panel.BringToFront();
			this.pnlListaRespuestas.Update();

			responseField.tbNombre.Focus();
		}

		internal void RemoverRespuesta(ResponseField responseField) {
			Panel panel = responseField.pnlResponseField;
			this.pnlListaRespuestas.Controls.Remove(panel);
			this.responseFields.Remove(responseField);
			responseField.Dispose();
			this.pnlListaRespuestas.Height -= 179;
		}

		private CommandTagsManager.CommandTag[] VerEtiquetas() {
			List<CommandTagsManager.CommandTag> etiquetas = new List<CommandTagsManager.CommandTag>();

			if(this.cbEtiquetaCommon.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Common);

			if(this.cbEtiquetaMod.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Mod);

			if(this.cbEtiquetaEmote.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Emote);

			if(this.cbEtiquetaMeme.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Meme);

			if(this.cbEtiquetaChaos.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Chaos);

			if(this.cbEtiquetaGame.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Game);

			if(this.cbEtiquetaOutdated.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Outdated);

			if(this.cbEtiquetaMaintenance.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Maintenance);

			if(this.cbEtiquetaPapa.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Papa);

			if(this.cbEtiquetaHourai.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Hourai);

			if(this.cbEtiquetaGuide.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Guide);

			return etiquetas.ToArray();
		}
	}
}
